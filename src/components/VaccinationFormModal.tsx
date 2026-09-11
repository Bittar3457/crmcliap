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
import { createVaccination, updateVaccination } from '@/services/vaccinations'
import { getPatients } from '@/services/patients'
import type { Vaccination, VaccinationStatus, Patient } from '@/types/crm'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface VaccinationFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaccination?: Vaccination | null
  defaultPatientId?: string
  onSuccess: () => void
}

export function VaccinationFormModal({
  open,
  onOpenChange,
  vaccination,
  defaultPatientId,
  onSuccess,
}: VaccinationFormModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientId, setPatientId] = useState(defaultPatientId || '')
  const [vaccineName, setVaccineName] = useState('')
  const [dose, setDose] = useState('1ª dose')
  const [scheduledDate, setScheduledDate] = useState('')
  const [administeredDate, setAdministeredDate] = useState('')
  const [status, setStatus] = useState<VaccinationStatus>('agendada')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      getPatients().then(setPatients).catch(console.error)
    }
  }, [open])

  useEffect(() => {
    if (vaccination) {
      setPatientId(vaccination.patient)
      setVaccineName(vaccination.vaccine_name || '')
      setDose(vaccination.dose || '')
      setScheduledDate(vaccination.scheduled_date ? vaccination.scheduled_date.split('T')[0] : '')
      setAdministeredDate(
        vaccination.administered_date ? vaccination.administered_date.split('T')[0] : '',
      )
      setStatus(vaccination.status || 'agendada')
      setNotes(vaccination.notes || '')
    } else {
      setPatientId(defaultPatientId || '')
      setVaccineName('')
      setDose('1ª dose')
      const now = new Date()
      const yr = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const da = String(now.getDate()).padStart(2, '0')
      setScheduledDate(`${yr}-${mo}-${da}`)
      setAdministeredDate('')
      setStatus('agendada')
      setNotes('')
    }
  }, [vaccination, defaultPatientId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !vaccineName) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }
    setSaving(true)

    const payload = {
      patient: patientId,
      vaccine_name: vaccineName,
      dose,
      scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      administered_date: administeredDate ? new Date(administeredDate).toISOString() : undefined,
      status,
      notes,
    }

    try {
      if (vaccination) {
        await updateVaccination(vaccination.id, payload)
        toast({ title: 'Registro vacinal atualizado!' })
      } else {
        await createVaccination(payload)
        toast({ title: 'Vacina registrada no cartão!' })
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      toast({ title: 'Erro ao registrar vacina', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {vaccination ? 'Editar Vacina' : 'Registrar Nova Vacina'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Paciente (Criança) *</Label>
            <Select value={patientId} onValueChange={setPatientId} disabled={!!vaccination}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="vaccine_name">Nome da Vacina *</Label>
              <Input
                id="vaccine_name"
                value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)}
                placeholder="Ex.: Pentavalente, BCG"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dose">Dose / Etapa</Label>
              <Input
                id="dose"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="Ex.: 1ª dose, Reforço"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_date">Data Prevista</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="administered_date">Data de Aplicação</Label>
              <Input
                id="administered_date"
                type="date"
                value={administeredDate}
                onChange={(e) => setAdministeredDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status da Vacinação *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as VaccinationStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendada">Agendada</SelectItem>
                <SelectItem value="aplicada">Aplicada (Concluída)</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Lote / Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número do lote, fabricante, local da aplicação..."
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
              {vaccination ? 'Salvar Alterações' : 'Salvar no Cartão'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
