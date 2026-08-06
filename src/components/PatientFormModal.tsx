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
import { createPatient, updatePatient } from '@/services/patients'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
import type { Patient, BloodType } from '@/types/crm'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface PatientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient?: Patient | null
  onSuccess: () => void
}

export function PatientFormModal({
  open,
  onOpenChange,
  patient,
  onSuccess,
}: PatientFormModalProps) {
  const [formData, setFormData] = useState<Partial<Patient>>({
    full_name: '',
    birth_date: '',
    parent_name: '',
    phone: '',
    email: '',
    address: '',
    blood_type: 'Desconhecido',
    medical_notes: '',
    active: true,
  })

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (patient) {
      setFormData({
        full_name: patient.full_name || '',
        birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '',
        parent_name: patient.parent_name || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        blood_type: patient.blood_type || 'Desconhecido',
        medical_notes: patient.medical_notes || '',
        active: patient.active ?? true,
      })
    } else {
      setFormData({
        full_name: '',
        birth_date: '',
        parent_name: '',
        phone: '',
        email: '',
        address: '',
        blood_type: 'Desconhecido',
        medical_notes: '',
        active: true,
      })
    }
    setFieldErrors({})
  }, [patient, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFieldErrors({})

    const payload = {
      ...formData,
      birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : undefined,
    }

    try {
      if (patient) {
        await updatePatient(patient.id, payload)
        toast({ title: 'Paciente atualizado com sucesso!' })
      } else {
        await createPatient(payload)
        toast({ title: 'Paciente cadastrado com sucesso!' })
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      setFieldErrors(errors)
      if (Object.keys(errors).length === 0) {
        toast({
          title: 'Erro ao salvar paciente',
          description: 'Verifique os dados e tente novamente.',
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {patient ? 'Editar Paciente' : 'Novo Paciente (Criança)'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="full_name">Nome Completo da Criança *</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ex.: Maria Clara Silva"
                required
              />
              {fieldErrors.full_name && (
                <p className="text-xs text-red-500">{fieldErrors.full_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="parent_name">Nome do Responsável</Label>
              <Input
                id="parent_name"
                value={formData.parent_name || ''}
                onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                placeholder="Ex.: Ana Silva (mãe)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ''}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+5511999999999"
                required
              />
              {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail do Responsável</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="blood_type">Tipo Sanguíneo</Label>
              <Select
                value={formData.blood_type || 'Desconhecido'}
                onValueChange={(val) => setFormData({ ...formData, blood_type: val as BloodType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido'].map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address">Endereço Residencial</Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, bairro, cidade"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="medical_notes">Observações Médicas / Alergias</Label>
              <Textarea
                id="medical_notes"
                rows={3}
                value={formData.medical_notes || ''}
                onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })}
                placeholder="Alergias, pré-condições, medicamentos de uso contínuo..."
              />
            </div>
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
              {patient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
