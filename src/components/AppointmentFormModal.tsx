import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAppointment, updateAppointment } from '@/services/appointments'
import { getPatients } from '@/services/patients'
import type { Appointment, AppointmentType, AppointmentStatus, Patient } from '@/types/crm'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface AppointmentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment?: Appointment | null
  defaultPatientId?: string
  onSuccess: () => void
}

export function AppointmentFormModal({
  open,
  onOpenChange,
  appointment,
  defaultPatientId,
  onSuccess,
}: AppointmentFormModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState(defaultPatientId || '')
  const [type, setType] = useState<AppointmentType>('consulta')
  const [status, setStatus] = useState<AppointmentStatus>('agendado')
  const [dateTime, setDateTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      getPatients().then(setPatients).catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (appointment) {
      setPatientId(appointment.patient)
      setType(appointment.type || 'consulta')
      setStatus(appointment.status || 'agendado')
      setDateTime(
        appointment.date_time ? new Date(appointment.date_time).toISOString().slice(0, 16) : '',
      )
      setNotes(appointment.notes || '')
    } else {
      setPatientId(defaultPatientId || '')
      setType('consulta')
      setStatus('agendado')
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      setDateTime(tomorrow.toISOString().slice(0, 16))
      setNotes('')
    }
  }, [appointment, defaultPatientId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId) {
      toast({ title: 'Selecione um paciente', variant: 'destructive' })
      return
    }
    setSaving(true)

    const payload = {
      patient: patientId,
      type,
      status,
      date_time: new Date(dateTime).toISOString(),
      notes,
    }

    try {
      if (appointment) {
        await updateAppointment(appointment.id, payload)
        toast({ title: 'Agendamento atualizado!' })
      } else {
        await createAppointment(payload)
        toast({ title: 'Consulta/vacinação agendada com sucesso!' })
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      toast({ title: 'Erro ao salvar agendamento', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Paciente (Criança) *</Label>
            <Select value={patientId} onValueChange={setPatientId} disabled={!!appointment}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name} ({p.parent_name || 'Sem resp.'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de Atendimento *</Label>
              <Select value={type} onValueChange={(v) => setType(v as AppointmentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="vacinacao">Vacinação</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="telemedicina">Telemedicina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date_time">Data e Horário *</Label>
            <Input
              id="date_time"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Anotações / Observações</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da consulta, sintomas, lembretes..."
            />
          </div>

          <DialogFooter className="mt-6 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-teal-800 hover:bg-teal-900 text-white"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {appointment ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
