import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  Inbox,
  CheckCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getPatient } from '@/services/patients'
import { getAppointmentsForPatient } from '@/services/appointments'
import { getVaccinationsForPatient } from '@/services/vaccinations'
import {
  getConversationMessages,
  sendInboxMessage,
  formatInboxTemplate,
  getInboxTemplates,
} from '@/services/whatsapp-inbox'
import type { Patient, Appointment, Vaccination } from '@/types/crm'
import type { WhatsAppChatMessage } from '@/types/whatsapp-inbox'
import { formatPhoneNumber, calculateAge, buildWhatsAppLink } from '@/lib/whatsapp-utils'
import { AppointmentFormModal } from '@/components/AppointmentFormModal'
import { VaccinationFormModal } from '@/components/VaccinationFormModal'
import { toast } from '@/components/ui/use-toast'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [quickReply, setQuickReply] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

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

      if (p) {
        const msgs = await getConversationMessages(`conv-${p.id}`, p.phone, p.id)
        setMessages(msgs)
      }
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
    const text = `Olá, ${patient.parent_name || 'Responsável'}! Como está o(a) ${patient.full_name}? Entramos em contato da Cliap • Pediatria e Imunização.`
    window.open(buildWhatsAppLink(patient.phone, text), '_blank')
  }

  const handleComposeWithPatient = () => {
    navigate('/whatsapp', { state: { patientId: patient.id } })
  }

  const handleOpenInbox = () => {
    navigate('/inbox-whatsapp', {
      state: { selectPhone: patient.phone, selectPatientId: patient.id },
    })
  }

  const handleSendQuickMessage = async () => {
    if (!quickReply.trim() || !patient) return
    setSendingMsg(true)
    try {
      const sent = await sendInboxMessage({
        conversationId: `conv-${patient.id}`,
        phone: patient.phone,
        content: quickReply,
        patientId: patient.id,
        senderName: 'Recepção Cliap',
      })
      setMessages((prev) => [...prev, sent])
      setQuickReply('')
      toast({
        title: 'Mensagem enviada via WhatsApp!',
        description: 'Gravada no prontuário e aberta no WhatsApp oficial.',
      })
    } catch {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' })
    } finally {
      setSendingMsg(false)
    }
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
            onClick={handleOpenInbox}
            variant="outline"
            className="border-teal-300 text-teal-800 hover:bg-teal-50"
          >
            <Inbox className="h-4 w-4 mr-2" />
            Ver na Inbox
          </Button>
          <Button
            onClick={handleComposeWithPatient}
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            Redigir com IA
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
          <TabsTrigger value="appointments">Agendamentos ({appointments.length})</TabsTrigger>
          <TabsTrigger value="vaccines">Cartão Vacinal ({vaccinations.length})</TabsTrigger>
          <TabsTrigger value="whatsapp_history" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
            Histórico WhatsApp ({messages.length})
          </TabsTrigger>
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

        {/* ABA DE HISTÓRICO WHATSAPP SOLICITADA NO ITEM 6 DA ESPECIFICAÇÃO */}
        <TabsContent value="whatsapp_history" className="space-y-4 mt-4">
          <Card className="border-slate-200 shadow-subtle overflow-hidden">
            <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-[#1F3A4D] flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  Histórico de Mensagens Trocadas com o Responsável
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Responsável: <strong>{patient.parent_name || 'Não informado'}</strong> • Telefone:{' '}
                  <strong>{formatPhoneNumber(patient.phone)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInbox}
                  className="text-xs border-teal-200 text-teal-800 hover:bg-teal-50"
                >
                  <Inbox className="h-3.5 w-3.5 mr-1" />
                  Abrir na Inbox WhatsApp
                </Button>
              </div>
            </div>

            <CardContent className="p-0">
              {/* Área dos balões de conversa mesclados por ordem de tempo */}
              <div
                className="p-5 max-h-[460px] overflow-y-auto space-y-3 bg-[#EFEAE2] bg-opacity-95"
                style={{
                  backgroundImage:
                    'radial-gradient(#d4cbbe 0.75px, transparent 0.75px), radial-gradient(#d4cbbe 0.75px, #efeae2 0.75px)',
                  backgroundSize: '28px 28px',
                  backgroundPosition: '0 0, 14px 14px',
                }}
              >
                {messages.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 bg-white/80 rounded-xl p-4 max-w-sm mx-auto border">
                    Nenhuma mensagem registrada no histórico deste paciente.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOutbound = m.direction === 'enviada'
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs relative ${
                            isOutbound
                              ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs border border-[#c3f0bb]'
                              : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] mb-1 font-semibold">
                            <span className={isOutbound ? 'text-emerald-800' : 'text-teal-800'}>
                              {m.senderName ||
                                (isOutbound
                                  ? 'Recepção Cliap'
                                  : patient.parent_name || 'Responsável')}
                            </span>
                            <span className="text-slate-400 font-normal">
                              {new Date(m.timestamp).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(m.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="whitespace-pre-line leading-relaxed text-[12px] text-slate-800 font-sans">
                            {m.content}
                          </p>

                          <div className="flex items-center justify-end gap-1 mt-1 pt-0.5 text-[9px] text-slate-400">
                            {isOutbound && (
                              <CheckCheck className="h-3 w-3 text-emerald-600 inline" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Caixa rápida de envio de mensagem diretamente da ficha */}
              <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Enviar resposta rápida por WhatsApp:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Abre o WhatsApp com mensagem preenchida e registra no prontuário
                  </span>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    value={quickReply}
                    onChange={(e) => setQuickReply(e.target.value)}
                    placeholder={`Escreva uma mensagem para ${patient.parent_name || 'o responsável'}...`}
                    className="text-xs resize-none bg-slate-50/70 border-slate-300 focus:bg-white"
                  />
                  <Button
                    onClick={handleSendQuickMessage}
                    disabled={sendingMsg || !quickReply.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white self-end shrink-0 text-xs px-4 h-10"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Enviar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
