import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  Calendar,
  Syringe,
  MessageSquare,
  Plus,
  Send,
  ArrowLeft,
  FileText,
  Clock,
  Droplet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getPatient } from '@/services/patients'
import { getAppointmentsForPatient } from '@/services/appointments'
import { getVaccinationsForPatient } from '@/services/vaccinations'
import type { Patient, Appointment, Vaccination } from '@/types/crm'
import { formatPhoneNumber, calculateAge, buildWhatsAppLink } from '@/lib/whatsapp-utils'
import { AppointmentFormModal } from '@/components/AppointmentFormModal'
import { VaccinationFormModal } from '@/components/VaccinationFormModal'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)

  const [apptModalOpen, setApptModalOpen] = useState(false)
  const [vacModalOpen, setVacModalOpen] = useState(false)

  const loadAll = async () => {
    if (!id) return
    try {
      const [p, appts, vacs] = await Promise.all([
        getPatient(id),
        getAppointmentsForPatient(id),
        getVaccinationsForPatient(id),
      ])
      setPatient(p)
      setAppointments(appts)
      setVaccinations(vacs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando prontuário...</div>
  }

  if (!patient) {
    return <div className="p-8 text-center text-slate-500">Paciente não encontrado.</div>
  }

  const handleOpenWhatsApp = () => {
    const text = `Olá ${patient.parent_name || 'Responsável'}, como está o(a) ${patient.full_name}? Entramos em contato da Clínica de Pediatria.`
    window.open(buildWhatsAppLink(patient.phone, text), '_blank')
  }

  const handleComposeWithPatient = () => {
    navigate('/whatsapp', { state: { patientId: patient.id } })
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/pacientes')}
        className="text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Pacientes
      </Button>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-teal-800 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {patient.full_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{patient.full_name}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Idade:{' '}
                <strong className="text-slate-800">{calculateAge(patient.birth_date)}</strong>
              </span>
              <span>•</span>
              <span>
                Responsável:{' '}
                <strong className="text-slate-800">{patient.parent_name || 'N/A'}</strong>
              </span>
              <span>•</span>
              <span>
                Tipo Sanguíneo:{' '}
                <strong className="text-teal-800">{patient.blood_type || 'N/A'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleComposeWithPatient}
            variant="outline"
            className="border-teal-200 text-teal-800 hover:bg-teal-50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Centro de Mensagens
          </Button>
          <Button
            onClick={handleOpenWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar via WhatsApp
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="overview">Visão Geral & Anotações</TabsTrigger>
          <TabsTrigger value="appointments">
            Histórico de Agendamentos ({appointments.length})
          </TabsTrigger>
          <TabsTrigger value="vaccines">Cartão Vacinal ({vaccinations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card className="border-slate-200 shadow-subtle">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-teal-800" />
                Dados Cadastrais e Observações Médicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Telefone / WhatsApp</p>
                  <p className="font-medium text-slate-800">{formatPhoneNumber(patient.phone)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">E-mail</p>
                  <p className="font-medium text-slate-800">{patient.email || 'Não cadastrado'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-400">Endereço Residencial</p>
                  <p className="font-medium text-slate-800">
                    {patient.address || 'Não cadastrado'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-400">Observações Médicas e Alergias</p>
                  <div className="mt-1 p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 text-slate-800">
                    {patient.medical_notes || 'Nenhuma observação ou alergia registrada.'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Agendamentos do Paciente</h3>
            <Button
              size="sm"
              onClick={() => setApptModalOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Novo Agendamento
            </Button>
          </div>

          <div className="space-y-2">
            {appointments.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center bg-white rounded-lg border">
                Nenhum agendamento para este paciente.
              </p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-semibold capitalize text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {a.type}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {new Date(a.date_time).toLocaleString('pt-BR')}
                    </p>
                    {a.notes && <p className="text-xs text-slate-500">{a.notes}</p>}
                  </div>
                  <span className="text-xs font-medium capitalize px-2 py-1 rounded bg-slate-100 text-slate-700">
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="vaccines" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Registro e Histórico Vacinal</h3>
            <Button
              size="sm"
              onClick={() => setVacModalOpen(true)}
              className="bg-teal-800 hover:bg-teal-900 text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Registrar Vacina
            </Button>
          </div>

          <div className="space-y-2">
            {vaccinations.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center bg-white rounded-lg border">
                Nenhuma vacina registrada ainda.
              </p>
            ) : (
              vaccinations.map((v) => (
                <div
                  key={v.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">{v.vaccine_name}</p>
                    <p className="text-xs text-slate-500">
                      Dose: {v.dose || '1ª dose'} • Prevista para:{' '}
                      {v.scheduled_date
                        ? new Date(v.scheduled_date).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      v.status === 'aplicada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'atrasada'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AppointmentFormModal
        open={apptModalOpen}
        onOpenChange={setApptModalOpen}
        defaultPatientId={patient.id}
        onSuccess={loadAll}
      />

      <VaccinationFormModal
        open={vacModalOpen}
        onOpenChange={setVacModalOpen}
        defaultPatientId={patient.id}
        onSuccess={loadAll}
      />
    </div>
  )
}
