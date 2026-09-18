import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  Syringe,
  MessageSquare,
  Clock,
  Send,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { getAppointments, updateAppointment } from '@/services/appointments'
import { getVaccinations } from '@/services/vaccinations'
import { getPatients } from '@/services/patients'
import { getWhatsAppMessages } from '@/services/whatsapp'
import type { Appointment, Vaccination, WhatsAppMessage } from '@/types/crm'
import { useRealtime } from '@/hooks/use-realtime'
import { buildWhatsAppLink, formatPhoneNumber, openWhatsAppExternal } from '@/lib/whatsapp-utils'
import { isTodayLocal, isPastDayLocal } from '@/lib/date-utils'
import { toast } from '@/components/ui/use-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [delayedAppointments, setDelayedAppointments] = useState<Appointment[]>([])
  const [upcomingVaccines, setUpcomingVaccines] = useState<Vaccination[]>([])
  const [patientCount, setPatientCount] = useState(0)
  const [pendingMessages, setPendingMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const safeTime = (dateStr?: string | Date | null): number => {
    if (!dateStr) return 0
    const t = new Date(dateStr).getTime()
    return isNaN(t) ? 0 : t
  }

  const formatSafeTime = (dateStr?: string | Date | null): string => {
    if (!dateStr) return '--:--'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '--:--'
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatSafeDate = (dateStr?: string | Date | null): string => {
    if (!dateStr) return 'Data não informada'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Data inválida'
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setLoadError(null)

      // Usa allSettled para garantir que falha em uma coleção não quebre todo o painel
      const [apptsRes, vacsRes, patientsRes, msgsRes] = await Promise.allSettled([
        getAppointments(),
        getVaccinations(),
        getPatients(),
        getWhatsAppMessages(),
      ])

      const appts = apptsRes.status === 'fulfilled' ? apptsRes.value || [] : []
      const vacs = vacsRes.status === 'fulfilled' ? vacsRes.value || [] : []
      const patients = patientsRes.status === 'fulfilled' ? patientsRes.value || [] : []
      const msgs = msgsRes.status === 'fulfilled' ? msgsRes.value || [] : []

      // Se todas as consultas principais falharem, registra erro geral
      const failures = [apptsRes, vacsRes, patientsRes, msgsRes].filter(
        (r) => r.status === 'rejected',
      )
      if (failures.length === 4) {
        setLoadError(
          'Serviço temporariamente indisponível. Não foi possível comunicar com o banco de dados.',
        )
        return
      }

      setPatientCount(patients.filter((p) => p && p.active !== false).length)

      // 1. Filtrar estritamente agendamentos do dia de hoje no fuso local
      const todayAppts = appts
        .filter((a) => Boolean(a?.date_time && isTodayLocal(a.date_time)))
        .sort((a, b) => safeTime(a.date_time) - safeTime(b.date_time))
      setTodayAppointments(todayAppts)

      // 2. Filtrar consultas atrasadas (data anterior a hoje e status pendente/confirmado)
      const delayed = appts
        .filter((a) => {
          if (!a?.date_time) return false
          const isPast = isPastDayLocal(a.date_time)
          const isPending = a.status === 'agendado' || a.status === 'confirmado'
          return isPast && isPending
        })
        .sort((a, b) => safeTime(b.date_time) - safeTime(a.date_time))
      setDelayedAppointments(delayed)

      const pendingVacs = vacs.filter(
        (v) => v && (v.status === 'agendada' || v.status === 'atrasada'),
      )
      setUpcomingVaccines(pendingVacs.slice(0, 5))

      const drafts = msgs.filter((m) => m && (m.status === 'rascunho' || m.status === 'agendada'))
      setPendingMessages(drafts)
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setLoadError(err?.message || 'Erro ao carregar dados do painel.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('appointments', () => loadData())
  useRealtime('patients', () => loadData())
  useRealtime('whatsapp_messages', () => loadData())

  const handleSendReminder = async (appt: Appointment) => {
    if (!appt.expand?.patient) return
    const patient = appt.expand.patient
    const d = appt.date_time ? new Date(appt.date_time) : null
    const dateFormatted =
      d && !isNaN(d.getTime())
        ? d.toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : 'horário a confirmar'

    const messageText = `Olá, ${patient.parent_name || 'Responsável'}! Aqui é da equipe Cliap (Pediatria e Imunização). Lembrete de agendamento para ${patient.full_name}:\n- Data/Hora: ${dateFormatted}\n- Tipo: ${appt.type}\nPor favor, confirme respondendo esta mensagem!\n\nAtenciosamente,\nEquipe Cliap`

    openWhatsAppExternal(buildWhatsAppLink(patient.phone, messageText))

    try {
      await updateAppointment(appt.id, { reminder_generated: true, status: 'confirmado' })
      toast({
        title: 'Lembrete enviado via WhatsApp!',
        description: 'Status atualizado para confirmado.',
      })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAsDone = async (apptId: string) => {
    try {
      await updateAppointment(apptId, { status: 'concluido' })
      toast({
        title: 'Consulta marcada como concluída!',
      })
      loadData()
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao atualizar consulta',
        variant: 'destructive',
      })
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  if (loadError && !loading) {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center animate-fade-in space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-sm">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-xl font-bold text-slate-900">Instabilidade temporária de conexão</h3>
          <p className="text-sm text-slate-600">
            Não foi possível carregar as informações do Painel no momento. O servidor pode estar se
            recuperando de uma oscilação de rede.
          </p>
        </div>
        <Button onClick={() => loadData()} className="bg-[#1F3A4D] hover:bg-[#2A4B63] text-white">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {user?.name || 'Doutor(a)'}! 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => navigate('/whatsapp')}
            className="bg-teal-800 hover:bg-teal-900 text-white shadow-sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar WhatsApp
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Agendados Hoje
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{todayAppointments.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Vacinas Próximas
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{upcomingVaccines.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
              <Syringe className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pacientes Ativos
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{patientCount}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mensagens Pendentes
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingMessages.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-teal-800" />
                Pacientes Agendados Hoje
              </CardTitle>
              {todayAppointments.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {todayAppointments.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/agendamentos')}
              className="text-xs text-teal-800 hover:text-teal-900"
            >
              Ver agenda <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-medium text-slate-600">Nenhum agendamento para hoje.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Os agendamentos do dia aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {appt.expand?.patient?.full_name || 'Paciente'}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize ${
                          appt.status === 'confirmado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <Clock className="h-3 w-3 inline mr-1 text-slate-400" />
                      {formatSafeTime(appt.date_time)} •{' '}
                      <span className="capitalize">{appt.type}</span>
                      {appt.expand?.patient?.parent_name && (
                        <span> • Resp: {appt.expand.patient.parent_name}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendReminder(appt)}
                      className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50 h-8"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Lembrete WA
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center">
              <Syringe className="h-4 w-4 mr-2 text-teal-800" />
              Vacinações Pendentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vacinacoes')}
              className="text-xs text-teal-800 hover:text-teal-900"
            >
              Ver vacinas <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {upcomingVaccines.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Nenhuma vacina pendente no momento.
              </p>
            ) : (
              upcomingVaccines.map((vac) => (
                <div
                  key={vac.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {vac.vaccine_name} ({vac.dose || '1ª dose'})
                    </p>
                    <p className="text-xs text-slate-500">
                      Paciente: {vac.expand?.patient?.full_name || 'Paciente'}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                      vac.status === 'atrasada'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {vac.status}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção separada: Consultas Atrasadas */}
      <Card className="border-slate-200 shadow-subtle border-l-4 border-l-[#B06A5E]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-[#B06A5E]/10 text-[#B06A5E] flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900">
                  Consultas Atrasadas
                </CardTitle>
                <Badge
                  variant="outline"
                  className={
                    delayedAppointments.length > 0
                      ? 'bg-[#B06A5E]/10 text-[#B06A5E] border-[#B06A5E]/30 font-semibold'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 font-normal'
                  }
                >
                  {delayedAppointments.length > 0
                    ? `${delayedAppointments.length} pendente${delayedAppointments.length > 1 ? 's' : ''}`
                    : 'Em dia'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Agendamentos com data anterior a hoje que ainda não foram marcados como concluídos
                ou cancelados
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/agendamentos')}
            className="text-xs text-teal-800 hover:text-teal-900 self-start sm:self-auto"
          >
            Gerenciar agendamentos <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-4">
          {delayedAppointments.length === 0 ? (
            <div className="py-6 text-center text-slate-500 flex flex-col items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-700">Tudo em dia!</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Não há consultas de datas passadas pendentes de atendimento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {delayedAppointments.map((appt) => {
                const apptDate = appt.date_time ? new Date(appt.date_time) : null
                const isValidDate = apptDate && !isNaN(apptDate.getTime())
                const monthShort = isValidDate
                  ? apptDate.toLocaleDateString('pt-BR', { month: 'short' })
                  : '---'
                const dayNum = isValidDate ? apptDate.getDate() : '--'
                const yearNum = isValidDate ? apptDate.getFullYear() : '----'
                const realDateFormatted = formatSafeDate(appt.date_time)
                const realTimeFormatted = formatSafeTime(appt.date_time)

                return (
                  <div
                    key={appt.id}
                    className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg bg-[#B06A5E]/10 border border-[#B06A5E]/20 text-[#B06A5E] shrink-0 min-w-[72px]">
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {monthShort}
                        </span>
                        <span className="text-lg font-extrabold leading-none my-0.5">{dayNum}</span>
                        <span className="text-[10px] font-medium text-slate-500">{yearNum}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {appt.expand?.patient?.full_name || 'Paciente'}
                          </p>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#B06A5E]/15 text-[#8f4f44] border border-[#B06A5E]/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Data real: {realDateFormatted} às {realTimeFormatted}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 capitalize">
                            {appt.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Tipo: <strong className="capitalize text-slate-700">{appt.type}</strong>
                          {appt.expand?.patient?.parent_name && (
                            <span> • Responsável: {appt.expand.patient.parent_name}</span>
                          )}
                          {appt.notes && (
                            <span className="block text-slate-600 italic mt-0.5">
                              "{appt.notes}"
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendReminder(appt)}
                        className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50 h-8"
                        title="Enviar mensagem para reagendamento ou confirmação via WhatsApp"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Contatar WA
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsDone(appt.id)}
                        className="text-xs text-emerald-700 hover:bg-emerald-50 h-8"
                        title="Marcar consulta atrasada como concluída"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Concluir
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
