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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { getAppointments, updateAppointment } from '@/services/appointments'
import { getVaccinations } from '@/services/vaccinations'
import { getPatients } from '@/services/patients'
import { getWhatsAppMessages } from '@/services/whatsapp'
import type { Appointment, Vaccination, WhatsAppMessage } from '@/types/crm'
import { useRealtime } from '@/hooks/use-realtime'
import { buildWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp-utils'
import { toast } from '@/components/ui/use-toast'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [upcomingVaccines, setUpcomingVaccines] = useState<Vaccination[]>([])
  const [patientCount, setPatientCount] = useState(0)
  const [pendingMessages, setPendingMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [appts, vacs, patients, msgs] = await Promise.all([
        getAppointments(),
        getVaccinations(),
        getPatients(),
        getWhatsAppMessages(),
      ])

      setPatientCount(patients.filter((p) => p.active !== false).length)

      const todayStr = new Date().toISOString().split('T')[0]
      const todayAppts = appts.filter((a) => a.date_time && a.date_time.startsWith(todayStr))
      setTodayAppointments(todayAppts.length > 0 ? todayAppts : appts.slice(0, 5))

      const pendingVacs = vacs.filter((v) => v.status === 'agendada' || v.status === 'atrasada')
      setUpcomingVaccines(pendingVacs.slice(0, 5))

      const drafts = msgs.filter((m) => m.status === 'rascunho' || m.status === 'agendada')
      setPendingMessages(drafts)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
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
    const dateFormatted = new Date(appt.date_time).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })

    const messageText = `Olá, ${patient.parent_name || 'Responsável'}! Aqui é da equipe Cliap (Pediatria e Imunização). Lembrete de agendamento para ${patient.full_name}:\n- Data/Hora: ${dateFormatted}\n- Tipo: ${appt.type}\nPor favor, confirme respondendo esta mensagem!\n\nAtenciosamente,\nEquipe Cliap`

    window.open(buildWhatsAppLink(patient.phone, messageText), '_blank')

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
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
            <CardTitle className="text-base font-bold text-slate-800 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-teal-800" />
              Próximos Agendamentos
            </CardTitle>
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
              <p className="text-sm text-slate-500 text-center py-6">
                Nenhum agendamento para hoje.
              </p>
            ) : (
              todayAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {appt.expand?.patient?.full_name || 'Paciente'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(appt.date_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • <span className="capitalize">{appt.type}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReminder(appt)}
                    className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Lembrete WA
                  </Button>
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
    </div>
  )
}
