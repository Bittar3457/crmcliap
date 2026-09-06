import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Sparkles,
  Send,
  Save,
  Clock,
  User,
  CheckCircle,
  Loader2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPatients } from '@/services/patients'
import { getCareInstructions } from '@/services/care-instructions'
import { getAppointments } from '@/services/appointments'
import { getWhatsAppMessages, createWhatsAppMessage, generateAiDraft } from '@/services/whatsapp'
import type { Patient, CareInstruction, WhatsAppMessage, Appointment } from '@/types/crm'
import { buildWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export type MessageType = 'confirmacao' | 'lembrete' | 'orientacao' | 'livre'

export default function WhatsAppCenter() {
  const location = useLocation()
  const stateNav = location.state as { patientId?: string; instructionId?: string } | null

  const [patients, setPatients] = useState<Patient[]>([])
  const [instructions, setInstructions] = useState<CareInstruction[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])

  const [messageType, setMessageType] = useState<MessageType>(
    stateNav?.instructionId ? 'orientacao' : 'confirmacao',
  )
  const [selectedPatientId, setSelectedPatientId] = useState<string>(stateNav?.patientId || '')
  const [selectedInstructionId, setSelectedInstructionId] = useState<string>(
    stateNav?.instructionId || '',
  )
  const [notes, setNotes] = useState<string>('')
  const [messageContent, setMessageContent] = useState<string>('')

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadInitialData = async () => {
    try {
      const [pList, iList, aList, mList] = await Promise.all([
        getPatients(),
        getCareInstructions(),
        getAppointments(),
        getWhatsAppMessages(),
      ])
      setPatients(pList)
      setInstructions(iList)
      setAppointments(aList)
      setMessages(mList)

      if (!selectedPatientId && pList.length > 0) {
        setSelectedPatientId(pList[0].id)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useRealtime('whatsapp_messages', () => {
    getWhatsAppMessages(selectedPatientId).then(setMessages).catch(console.error)
  })

  // Retorna a próxima consulta agendada ou confirmada do paciente selecionado
  const getNextAppointment = (patientId: string) => {
    if (!patientId) return null
    const patientAppts = appointments
      .filter(
        (a) =>
          a.patient === patientId &&
          (a.status === 'agendado' || a.status === 'confirmado') &&
          new Date(a.date_time).getTime() >= Date.now() - 1000 * 60 * 60 * 24, // últimas 24h em diante
      )
      .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
    return (
      patientAppts[0] ||
      appointments
        .filter((a) => a.patient === patientId)
        .sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())[0] ||
      null
    )
  }

  // Gera o template de acordo com o tipo e paciente selecionado
  const generateTemplateText = (
    type: MessageType,
    patientId: string,
    instructionId: string = selectedInstructionId,
  ): string => {
    const patient = patients.find((p) => p.id === patientId)
    const patientName = patient?.full_name || 'o paciente'
    const parentName = patient?.parent_name ? `Olá, ${patient.parent_name}!` : 'Olá!'
    const nextAppt = getNextAppointment(patientId)

    const apptDateStr = nextAppt
      ? new Date(nextAppt.date_time).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null
    const apptTimeStr = nextAppt
      ? new Date(nextAppt.date_time).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

    switch (type) {
      case 'confirmacao': {
        if (apptDateStr && apptTimeStr) {
          return `${parentName} Tudo bem?

Estamos entrando em contato da Clínica de Pediatria e Imunização para confirmar a consulta de ${patientName} agendada para ${apptDateStr} às ${apptTimeStr}.

Poderia, por gentileza, nos confirmar se podemos manter o agendamento? Responda SIM para confirmar ou nos avise caso necessite remarcar. Obrigado!`
        }
        return `${parentName} Tudo bem?

Estamos entrando em contato da Clínica de Pediatria e Imunização para confirmar o agendamento de consulta de ${patientName}.

Poderia nos confirmar sua disponibilidade para mantermos o horário? Obrigado!`
      }

      case 'lembrete': {
        if (apptDateStr && apptTimeStr) {
          return `${parentName} Tudo bem?

Lembramos que a consulta de ${patientName} na Clínica de Pediatria e Imunização está agendada para ${apptDateStr} às ${apptTimeStr}.

Pedimos a gentileza de chegar com 10 minutos de antecedência e trazer a carteira de vacinação. Caso ocorra algum imprevisto, favor nos avisar com antecedência. Até breve!`
        }
        return `${parentName} Tudo bem?

Lembramos da consulta de ${patientName} na Clínica de Pediatria e Imunização.

Por gentileza, lembre-se de trazer a carteirinha de vacinação e documentos. Em caso de imprevistos, pedimos que nos avise com antecedência. Estamos à disposição!`
      }

      case 'orientacao': {
        if (instructionId) {
          const inst = instructions.find((i) => i.id === instructionId)
          if (inst) {
            return `${parentName}\n\nSeguem as orientações da Clínica de Pediatria para ${patientName}:\n\n${inst.content}\n\nQualquer dúvida, nossa equipe está à disposição!`
          }
        }
        return `${parentName} Seguem as orientações de atendimento e cuidados pediátricos para ${patientName}.

Qualquer dúvida ou intercorrência, nossa equipe está à total disposição para auxiliar!`
      }

      case 'livre':
        return ''
    }
  }

  // Mudança do tipo de mensagem
  const handleTypeChange = (newType: MessageType) => {
    setMessageType(newType)
    const newContent = generateTemplateText(newType, selectedPatientId, selectedInstructionId)
    setMessageContent(newContent)
  }

  // Mudança do paciente selecionado
  const handlePatientChange = (newPatientId: string) => {
    setSelectedPatientId(newPatientId)
    if (messageType !== 'livre') {
      const newContent = generateTemplateText(messageType, newPatientId, selectedInstructionId)
      setMessageContent(newContent)
    }
  }

  // Mudança da orientação
  const handleInstructionChange = (newInstId: string) => {
    setSelectedInstructionId(newInstId)
    if (messageType === 'orientacao') {
      const newContent = generateTemplateText('orientacao', selectedPatientId, newInstId)
      setMessageContent(newContent)
    }
  }

  // Preenchimento inicial assim que carregar dados ou se vier via navegação
  useEffect(() => {
    if (patients.length > 0 && selectedPatientId && !messageContent) {
      const initialText = generateTemplateText(
        messageType,
        selectedPatientId,
        selectedInstructionId,
      )
      setMessageContent(initialText)
    }
  }, [patients, selectedPatientId])

  const handleGenerateAiDraft = async () => {
    if (!selectedPatientId) {
      toast({ title: 'Selecione um paciente primeiro', variant: 'destructive' })
      return
    }

    setGenerating(true)
    try {
      const draft = await generateAiDraft({
        patient_id: selectedPatientId,
        instruction_id: selectedInstructionId || undefined,
        notes: notes || undefined,
      })
      setMessageContent(draft)
      toast({ title: 'Rascunho gerado com sucesso pela IA!' })
    } catch {
      toast({ title: 'Erro ao gerar rascunho de IA', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSendViaWhatsApp = async () => {
    if (!selectedPatientId || !messageContent.trim()) {
      toast({ title: 'Selecione o paciente e digite a mensagem', variant: 'destructive' })
      return
    }

    const patient = patients.find((p) => p.id === selectedPatientId)
    if (!patient) return

    setSaving(true)
    try {
      await createWhatsAppMessage({
        patient: selectedPatientId,
        direction: 'enviada',
        template: selectedInstructionId || undefined,
        content: messageContent,
        sent_at: new Date().toISOString(),
        status: 'enviada',
      })

      window.open(buildWhatsAppLink(patient.phone, messageContent), '_blank')
      toast({
        title: 'Abrindo WhatsApp...',
        description: 'A mensagem foi registrada no histórico.',
      })

      setMessageContent('')
      setNotes('')
      setSelectedInstructionId('')
      loadInitialData()
    } catch {
      toast({ title: 'Erro ao registrar mensagem', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedPatientId || !messageContent.trim()) return
    setSaving(true)
    try {
      await createWhatsAppMessage({
        patient: selectedPatientId,
        direction: 'enviada',
        template: selectedInstructionId || undefined,
        content: messageContent,
        status: 'rascunho',
      })
      toast({ title: 'Rascunho salvo!' })
      loadInitialData()
    } catch {
      toast({ title: 'Erro ao salvar rascunho', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const currentPatient = patients.find((p) => p.id === selectedPatientId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Centro de Mensagens WhatsApp</h2>
        <p className="text-sm text-slate-500">
          Redação assistida por IA e envio direto via deep link oficial do WhatsApp
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                <MessageSquare className="h-4 w-4 mr-2 text-teal-800" />
                Composição de Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="message-type"
                  className="font-semibold text-slate-800 flex items-center justify-between"
                >
                  <span>Tipo de Mensagem *</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Pré-preenche com modelo
                  </span>
                </Label>
                <Select
                  value={messageType}
                  onValueChange={(val) => handleTypeChange(val as MessageType)}
                >
                  <SelectTrigger
                    id="message-type"
                    className="bg-white border-teal-200 focus:ring-teal-500"
                  >
                    <SelectValue placeholder="Selecione o tipo de mensagem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmacao">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Confirmação (Próxima Consulta)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lembrete">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                        <span>Lembrete (Horário e Recomendações)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="orientacao">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                        <span>Orientação (Biblioteca de Cuidados)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="livre">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                        <span>Livre (Texto em branco / Personalizado)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Paciente Destinatário *</Label>
                <Select value={selectedPatientId} onValueChange={handlePatientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name} — Resp: {p.parent_name || 'N/A'} ({formatPhoneNumber(p.phone)}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>
                    Modelo de Orientação{' '}
                    {messageType === 'orientacao' ? '(Recomendado)' : '(Opcional)'}
                  </Label>
                  {selectedInstructionId && (
                    <button
                      type="button"
                      onClick={() => handleInstructionChange('')}
                      className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                    >
                      Limpar modelo
                    </button>
                  )}
                </div>
                <Select value={selectedInstructionId} onValueChange={handleInstructionChange}>
                  <SelectTrigger
                    className={
                      messageType === 'orientacao' ? 'border-purple-300 bg-purple-50/20' : ''
                    }
                  >
                    <SelectValue placeholder="Selecione um modelo da biblioteca" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Anotações para a IA (Opcional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: Lembrar de mencionar febre de 38.2°C ontem à noite e dosagem de dipirona..."
                />
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={generating}
                  variant="outline"
                  className="w-full border-teal-300 text-teal-900 bg-teal-50/50 hover:bg-teal-100/50"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-teal-800" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  )}
                  {generating ? 'Redigindo com IA...' : 'Redigir Rascunho com IA'}
                </Button>
              </div>

              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="content">Texto Final da Mensagem *</Label>
                <Textarea
                  id="content"
                  rows={8}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite ou edite a mensagem completa que será aberta no WhatsApp..."
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Salvar Rascunho
                </Button>

                <Button
                  onClick={handleSendViaWhatsApp}
                  disabled={saving || !messageContent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Send className="h-4 w-4 mr-2" /> Enviar via WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-200 shadow-subtle h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                <span>Histórico de Comunicação</span>
                {currentPatient && (
                  <span className="text-xs font-normal text-slate-500">
                    {currentPatient.full_name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Nenhuma mensagem registrada no histórico.
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-700">
                        {m.expand?.patient?.full_name || 'Paciente'}
                      </span>
                      <span>{new Date(m.created).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">
                      {m.content}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="capitalize text-slate-500">{m.direction}</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          m.status === 'enviada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
