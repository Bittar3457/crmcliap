import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, Calendar, ArrowRight, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { getPatients, deletePatient } from '@/services/patients'
import type { Patient } from '@/types/crm'
import { PatientFormModal } from '@/components/PatientFormModal'
import { formatPhoneNumber, calculateAge } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const navigate = useNavigate()

  const loadPatients = async () => {
    try {
      const data = await getPatients(search)
      setPatients(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [search])

  useRealtime('patients', () => loadPatients())

  const handleEdit = (p: Patient, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPatient(p)
    setModalOpen(true)
  }

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Tem certeza que deseja excluir o prontuário de ${name}?`)) return
    try {
      await deletePatient(id)
      toast({ title: 'Paciente removido.' })
      loadPatients()
    } catch {
      toast({ title: 'Erro ao remover paciente.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Prontuários e Pacientes
          </h2>
          <p className="text-sm text-slate-500">
            Gestão das fichas das crianças e contatos de responsáveis
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedPatient(null)
            setModalOpen(true)
          }}
          className="bg-teal-800 hover:bg-teal-900 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome da criança, responsável ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
            Nenhum paciente cadastrado ou encontrado.
          </div>
        ) : (
          patients.map((p) => (
            <Card
              key={p.id}
              onClick={() => navigate(`/pacientes/${p.id}`)}
              className="border-slate-200 shadow-subtle hover:shadow-elevation hover:border-teal-300 transition-all cursor-pointer group"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                        {p.full_name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Idade:{' '}
                        <span className="font-medium text-slate-700">
                          {calculateAge(p.birth_date)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-teal-800"
                      onClick={(e) => handleEdit(p, e)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-slate-400 hover:text-red-600"
                      onClick={(e) => handleDelete(p.id, p.full_name, e)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Responsável:</span>
                    <span className="font-medium text-slate-800">
                      {p.parent_name || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">WhatsApp:</span>
                    <span className="font-medium text-slate-800">{formatPhoneNumber(p.phone)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipo Sanguíneo:</span>
                    <span className="font-semibold text-teal-800">
                      {p.blood_type || 'Desconhecido'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs font-medium text-teal-800 pt-1">
                  Abrir prontuário <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <PatientFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        patient={selectedPatient}
        onSuccess={loadPatients}
      />
    </div>
  )
}
