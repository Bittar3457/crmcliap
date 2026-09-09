import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Settings2,
  RotateCcw,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { getMessageTemplates } from '@/services/message-templates'
import {
  getWhatsAppConfig,
  sendWhatsAppMessageApi,
  type WhatsAppConfig,
} from '@/services/whatsapp-api'
import { Link } from 'react-router-dom'
import { Zap, AlertTriangle, ExternalLink } from 'lucide-react'
import type {
  Patient,
  CareInstruction,
  WhatsAppMessage,
  Appointment,
  MessageTemplate,
  MessageTemplateType,
} from '@/types/crm'
import { buildWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp-utils'
import {
  interpolateTemplate,
  buildTemplateContext,
  DEFAULT_FALLBACK_TEMPLATES,
} from '@/lib/template-interpolator'
import { TemplateEditorModal } from '@/components/TemplateEditorModal'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export type MessageType = MessageTemplateType

export default function WhatsAppCenter() {
  const location = useLocation()
  const stateNav = location.state as { patientId?: string; instructionId?: string } | null

  const [patients, setPatients] = useState<Patient[]>([])
  const [instructions, setInstructions] = useState<CareInstruction[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])

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
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false)
  const [waConfig, setWaConfig] = useState<WhatsAppConfig | null>(null)

  const loadInitialData = async () => {
    try {
      const [pList, iList, aList, mList, tList, cfg] = await Promise.all([
        getPatients(),
        getCareInstructions(),
        getAppointments(),
        getWhatsAppMessages(),
        getMessageTemplates(),
        getWhatsAppConfig().catch(() => null),
      ])
      setPatients(pList)
      setInstructions(iList)
      setAppointments(aList)
      setMessages(mList)
      setTemplates(tList)
      if (cfg) setWaConfig(cfg)

      if (!selectedPatientId && pList.length > 0) {
        setSelectedPatientId(pList[0].id)
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Centro de WhatsApp:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useRealtime('whatsapp_messages', () => {
    getWhatsAppMessages(selectedPatientId).then(setMessages).catch(console.error)
  })

  // Retorna a próxima consulta agendada ou confirmada do paciente selecionado
  const getNextAppointment = useCallback(
    (patientId: string) => {
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
    },
    [appointments],
  )

  // Gera o texto interpolado a partir do template gravado no PocketBase (ou fallback no código)
  const generateTemplateText = useCallback(
    (
      type: MessageType,
      patientId: string,
      instructionId: string = selectedInstructionId,
    ): string => {
      const patient = patients.find((p) => p.id === patientId) || null
      const nextAppt = getNextAppointment(patientId)
      const instruction = instructionId
        ? instructions.find((i) => i.id === instructionId) || null
        : null

      // Busca template persistido no banco
      const matchedTemplate = templates.find((t) => t.type === type)
      const rawTemplate =
        matchedTemplate?.content !== undefined
          ? matchedTemplate.content
          : DEFAULT_FALLBACK_TEMPLATES[type]

      if (!rawTemplate) return ''

      const context = buildTemplateContext({
        patient,
        appointment: nextAppt,
        instruction,
      })

      return interpolateTemplate(rawTemplate, context)
    },
    [patients, instructions, templates, selectedInstructionId, getNextAppointment],
  )

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

  // Recarregar texto com template atual
  const handleResetToTemplate = () => {
    const text = generateTemplateText(messageType, selectedPatientId, selectedInstructionId)
    setMessageContent(text)
    toast({
      title: 'Mensagem atualizada',
      description: 'Texto recarregado a partir do modelo gravado no banco.',
    })
  }

  // Callback chamado ao salvar novos templates no banco
  const handleTemplatesUpdated = (updatedList: MessageTemplate[]) => {
    setTemplates(updatedList)
    // Atualiza o texto do tipo atualmente ativo
    const updated = generateTemplateText(messageType, selectedPatientId, selectedInstructionId)
    setMessageContent(updated)
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
  }, [patients, selectedPatientId, templates])

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
      // Se a integração Meta Cloud API estiver ativa e conectada, tenta o envio real server-side
      const isConnected =
        waConfig?.status === 'conectado' && waConfig?.has_token && waConfig?.phone_number_id
      let sentReal = false

      if (isConnected) {
        try {
          const apiRes = await sendWhatsAppMessageApi({
            to: patient.phone,
            content: messageContent,
            patient_id: selectedPatientId,
            template_id: selectedInstructionId || undefined,
          })

          if (apiRes.success) {
            sentReal = true
            toast({
              title: 'Mensagem enviada com sucesso pela Meta Cloud API!',
              description: `Entregue via WhatsApp oficial da Cliap para ${patient.parent_name || patient.full_name}.`,
            })
          } else {
            console.warn('Falha no envio via Meta API, acionando fallback deep link:', apiRes.error)
            toast({
              title: 'Aviso: Envio pela Cloud API indisponível',
              description: `${apiRes.error || 'Conta em análise ou limite atingido'}. Abrindo fallback via WhatsApp Web...`,
              variant: 'default',
            })
          }
        } catch (apiErr: unknown) {
          console.warn('Erro ao chamar API Meta, usando fallback:', apiErr)
          toast({
            title: 'Erro temporário na Cloud API',
            description: 'Redirecionando para envio manual via WhatsApp oficial (fallback)...',
          })
        }
      }

      // Se não enviou via Cloud API (ou se falhou/desconectado), usa o deep link com persistência
      if (!sentReal) {
        await createWhatsAppMessage({
          patient: selectedPatientId,
          direction: 'enviada',
          template: selectedInstructionId || undefined,
          content: messageContent,
          sent_at: new Date().toISOString(),
          status: 'enviada',
        })

        window.open(buildWhatsAppLink(patient.phone, messageContent), '_blank')
        if (!isConnected) {
          toast({
            title: 'Abrindo WhatsApp (Deep Link)',
            description: 'A mensagem foi registrada no prontuário do paciente.',
          })
        }
      }

      setMessageContent('')
      setNotes('')
      setSelectedInstructionId('')
      loadInitialData()
    } catch {
      toast({ title: 'Erro ao processar envio', variant: 'destructive' })
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

  const currentTemplate = templates.find((t) => t.type === messageType)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Centro de Mensagens WhatsApp</h2>
          <p className="text-sm text-slate-500">
            Redação assistida por IA, templates gravados e envio direto via deep link oficial
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Indicador de Status da Integração */}
          <Link to="/configuracoes-whatsapp">
            <Button
              variant="outline"
              size="sm"
              className={`h-9 text-xs font-semibold flex items-center gap-1.5 ${
                waConfig?.status === 'conectado'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                  : waConfig?.status === 'erro'
                    ? 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100/70'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              title="Clique para gerenciar a integração Meta Cloud API"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  waConfig?.status === 'conectado'
                    ? 'bg-emerald-500 animate-pulse'
                    : waConfig?.status === 'erro'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
                }`}
              />
              {waConfig?.status === 'conectado'
                ? 'Cloud API Conectada'
                : waConfig?.status === 'erro'
                  ? 'Cloud API: Erro'
                  : 'Integração: Desconectada'}
            </Button>
          </Link>

          <Button
            onClick={() => setIsEditorModalOpen(true)}
            variant="outline"
            className="border-[#1F3A4D]/30 text-[#1F3A4D] hover:bg-[#1F3A4D]/10 font-medium flex items-center gap-2 text-xs h-9"
          >
            <Settings2 className="h-4 w-4 text-[#1F3A4D]" />
            Editar Modelos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-teal-800" />
                  Composição de Mensagem
                </CardTitle>
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(true)}
                  className="text-xs font-semibold text-[#1F3A4D] hover:underline flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  Gerenciar textos dos 4 tipos
                </button>
              </div>
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
                        <span className="font-medium">Confirmação</span>
                        <span className="text-xs text-slate-400">— Próxima Consulta</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="lembrete">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-medium">Lembrete</span>
                        <span className="text-xs text-slate-400">— Horário e Recomendações</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="orientacao">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                        <span className="font-medium">Orientação</span>
                        <span className="text-xs text-slate-400">— Biblioteca de Cuidados</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="livre">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                        <span className="font-medium">Livre</span>
                        <span className="text-xs text-slate-400">— Personalizado / Avulso</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="truncate">
                    Modelo ativo:{' '}
                    <strong className="text-slate-700 font-semibold">
                      {currentTemplate?.title || 'Padrão do Sistema'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditorModalOpen(true)}
                    className="text-teal-700 hover:text-teal-900 underline font-medium"
                  >
                    Editar texto deste tipo
                  </button>
                </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="content" className="font-semibold text-slate-800">
                    Texto Final da Mensagem *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToTemplate}
                    className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                    title="Recarregar o texto com o modelo padrão deste tipo"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Recarregar Modelo
                  </Button>
                </div>
                <Textarea
                  id="content"
                  rows={8}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite ou edite a mensagem completa que será aberta no WhatsApp..."
                  className="font-normal leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1" /> Salvar Rascunho
                </Button>

                <Button
                  onClick={handleSendViaWhatsApp}
                  disabled={saving || !messageContent.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center"
                  title={
                    waConfig?.status === 'conectado'
                      ? 'Envio direto server-side via WhatsApp Cloud API oficial'
                      : 'Envio pelo WhatsApp oficial (deep link wa.me)'
                  }
                >
                  {waConfig?.status === 'conectado' ? (
                    <Zap className="h-4 w-4 mr-2 text-amber-300 fill-amber-300" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {waConfig?.status === 'conectado'
                    ? 'Enviar via Cloud API'
                    : 'Enviar via WhatsApp'}
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

      {/* Modal para gerenciar e gravar os modelos de mensagem no banco */}
      <TemplateEditorModal
        open={isEditorModalOpen}
        onOpenChange={setIsEditorModalOpen}
        templates={templates}
        onTemplatesUpdated={handleTemplatesUpdated}
        initialType={messageType}
      />
    </div>
  )
}
