import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Plus,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAppointments, updateAppointment } from '@/services/appointments'
import { createWhatsAppMessage } from '@/services/whatsapp'
import { sendInboxMessage, formatInboxTemplate } from '@/services/whatsapp-inbox'
import { INBOX_TEMPLATES } from '@/services/mock-inbox-data'
import type { Appointment, AppointmentStatus, Patient } from '@/types/crm'
import { AppointmentFormModal } from '@/components/AppointmentFormModal'
import { buildWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'
import {
  getWhatsAppConfig,
  sendWhatsAppMessageApi,
  type WhatsAppConfig,
} from '@/services/whatsapp-api'
import { Zap } from 'lucide-react'

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [waConfig, setWaConfig] = useState<WhatsAppConfig | null>(null)

  const loadAppts = async () => {
    try {
      const [data, cfg] = await Promise.all([
        getAppointments(),
        getWhatsAppConfig().catch(() => null),
      ])
      setAppointments(data)
      if (cfg) setWaConfig(cfg)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadAppts()
  }, [])

  useRealtime('appointments', () => loadAppts())

  const handleStatusChange = async (apptId: string, status: AppointmentStatus) => {
    try {
      await updateAppointment(apptId, { status })
      toast({ title: `Status alterado para ${status}` })
      loadAppts()
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  // Botão específico pedido: "Enviar confirmação por WhatsApp" que dispara o template de confirmação/lembrete
  const handleSendWhatsAppConfirmation = async (appt: Appointment) => {
    if (!appt.expand?.patient) {
      toast({ title: 'Paciente não vinculado ao agendamento', variant: 'destructive' })
      return
    }

    const patient = appt.expand.patient
    const template =
      INBOX_TEMPLATES.find((t) => t.type === 'confirmacao') ||
      INBOX_TEMPLATES.find((t) => t.type === 'lembrete_24h') ||
      INBOX_TEMPLATES[0]

    const interpolated = formatInboxTemplate(template.content, {
      patient,
      appointment: appt,
    })

    try {
      // Se tiver Cloud API conectada, tenta envio direto
      let sentReal = false
      if (waConfig?.status === 'conectado' && waConfig.has_token && waConfig.phone_number_id) {
        try {
          const apiRes = await sendWhatsAppMessageApi({
            to: patient.phone,
            content: interpolated,
            patient_id: patient.id,
          })
          if (apiRes.success) {
            sentReal = true
            toast({
              title: 'Confirmação enviada via WhatsApp Cloud API!',
              description: `Mensagem entregue com sucesso para ${patient.parent_name || patient.full_name}.`,
            })
          }
        } catch (e) {
          console.warn('Falha na Cloud API, acionando fallback:', e)
        }
      }

      // Se não enviou via Cloud API, aciona sendInboxMessage com deep link
      if (!sentReal) {
        await sendInboxMessage({
          conversationId: `conv-${patient.id}`,
          phone: patient.phone,
          content: interpolated,
          patientId: patient.id,
          senderName: 'Recepção Cliap',
        })
        toast({
          title: 'Confirmação enviada via WhatsApp (Deep Link)!',
          description: `Template disparado para ${patient.parent_name || patient.full_name}.`,
        })
      }

      // Atualiza o agendamento marcando lembrete gerado
      await updateAppointment(appt.id, {
        reminder_generated: true,
      })

      loadAppts()
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao registrar envio', variant: 'destructive' })
    }
  }

  const handleGenerateReminder = async (appt: Appointment) => {
    if (!appt.expand?.patient) return
    const p = appt.expand.patient
    const template = INBOX_TEMPLATES.find((t) => t.type === 'lembrete_24h') || INBOX_TEMPLATES[0]

    const msg = formatInboxTemplate(template.content, {
      patient: p,
      appointment: appt,
    })

    window.open(buildWhatsAppLink(p.phone, msg), '_blank')

    await updateAppointment(appt.id, { reminder_generated: true, status: 'confirmado' })
    await createWhatsAppMessage({
      patient: p.id,
      direction: 'enviada',
      content: msg,
      sent_at: new Date().toISOString(),
      status: 'enviada',
    }).catch(() => null)

    toast({ title: 'Lembrete gerado e enviado via WhatsApp!' })
    loadAppts()
  }

  const filteredAppts = appointments.filter((a) => {
    if (statusFilter === 'todos') return true
    return a.status === statusFilter
  })

  const getStatusColor = (s: AppointmentStatus) => {
    switch (s) {
      case 'confirmado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'concluido':
        return 'bg-slate-100 text-slate-800 border-slate-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'nao_compareceu':
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Agenda de Consultas e Vacinas</h2>
          <p className="text-sm text-slate-500">Gestão completa dos horários da Cliap</p>
        </div>
        <Button
          onClick={() => {
            setSelectedAppt(null)
            setModalOpen(true)
          }}
          className="bg-teal-800 hover:bg-teal-900 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Agendamento
        </Button>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {['todos', 'agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu'].map(
          (st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={
                statusFilter === st
                  ? 'bg-teal-800 text-white capitalize'
                  : 'text-slate-600 border-slate-200 capitalize'
              }
            >
              {st.replace('_', ' ')}
            </Button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {filteredAppts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border">
            Nenhum agendamento nesta categoria.
          </div>
        ) : (
          filteredAppts.map((a) => (
            <Card
              key={a.id}
              className="border-slate-200 shadow-subtle hover:border-teal-300 transition-colors"
            >
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-teal-50 text-teal-800 min-w-[70px]">
                    <span className="text-xs font-bold uppercase">
                      {new Date(a.date_time).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold">
                      {new Date(a.date_time).getDate()}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(a.date_time).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900">
                        {a.expand?.patient?.full_name || 'Paciente'}
                      </h3>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${getStatusColor(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tipo: <strong className="capitalize text-slate-700">{a.type}</strong> •
                      Responsável: {a.expand?.patient?.parent_name || 'N/A'}
                    </p>
                    {a.notes && <p className="text-xs text-slate-600 mt-1 italic">"{a.notes}"</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-2 border-t md:border-t-0 pt-2 md:pt-0">
                  {/* Botão pedido no item 5 da especificação: "Enviar confirmação por WhatsApp" */}
                  <Button
                    size="sm"
                    onClick={() => handleSendWhatsAppConfirmation(a)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium flex items-center"
                    title={
                      waConfig?.status === 'conectado'
                        ? 'Disparar confirmação diretamente via WhatsApp Cloud API oficial'
                        : 'Dispara o template de confirmação manualmente via deep link oficial'
                    }
                  >
                    {waConfig?.status === 'conectado' ? (
                      <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-300 fill-amber-300" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Enviar confirmação por WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReminder(a)}
                    className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Lembrete 24h
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(a.id, 'concluido')}
                    className="text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Concluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AppointmentFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        appointment={selectedAppt}
        onSuccess={loadAppts}
      />
    </div>
  )
}
