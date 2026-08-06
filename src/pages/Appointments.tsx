import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Plus, Send, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAppointments, updateAppointment } from '@/services/appointments'
import type { Appointment, AppointmentStatus } from '@/types/crm'
import { AppointmentFormModal } from '@/components/AppointmentFormModal'
import { buildWhatsAppLink } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  const loadAppts = async () => {
    try {
      const data = await getAppointments()
      setAppointments(data)
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

  const handleGenerateReminder = async (appt: Appointment) => {
    if (!appt.expand?.patient) return
    const p = appt.expand.patient
    const dateFormatted = new Date(appt.date_time).toLocaleString('pt-BR')

    const msg = `Olá ${p.parent_name || 'Responsável'}! Lembrete da consulta de ${p.full_name} na Clínica de Pediatria no dia ${dateFormatted}. Favor confirmar.`
    window.open(buildWhatsAppLink(p.phone, msg), '_blank')

    await updateAppointment(appt.id, { reminder_generated: true, status: 'confirmado' })
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
          <p className="text-sm text-slate-500">Gestão completa dos horários da clínica</p>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReminder(a)}
                    className="text-xs text-teal-800 border-teal-200 hover:bg-teal-50"
                  >
                    <Send className="h-3.5 w-3.5 mr-1" />
                    Gerar Lembrete
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
