import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Search,
  Send,
  UserCheck,
  UserX,
  ExternalLink,
  Sparkles,
  Phone,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  FileText,
  Calendar,
  Syringe,
  Smile,
  Info,
  RefreshCw,
  Plus,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  BadgeAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { getPatients } from '@/services/patients'
import { getAppointments } from '@/services/appointments'
import {
  getInboxConversations,
  getConversationMessages,
  sendInboxMessage,
  getInboxTemplates,
  formatInboxTemplate,
  type ConversationSummary,
} from '@/services/whatsapp-inbox'
import type { Patient, Appointment } from '@/types/crm'
import type { WhatsAppChatMessage, InboxMessageTemplate } from '@/types/whatsapp-inbox'
import { formatPhoneNumber, openWhatsAppExternal, buildWhatsAppLink } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { getWhatsAppConfig, type WhatsAppConfig } from '@/services/whatsapp-api'
import { Zap, Settings2 } from 'lucide-react'

export default function WhatsAppInbox() {
  const location = useLocation()
  const stateNav = location.state as { selectPhone?: string; selectPatientId?: string } | null

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string>('')
  const [activeMessages, setActiveMessages] = useState<WhatsAppChatMessage[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<InboxMessageTemplate[]>([])
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<InboxMessageTemplate | null>(null)
  const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false)
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false)
  const [newChatPhone, setNewChatPhone] = useState('')
  const [newChatPatientId, setNewChatPatientId] = useState('')
  const [waConfig, setWaConfig] = useState<WhatsAppConfig | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [loadError, setLoadError] = useState<string | null>(null)

  // Carrega lista inicial de conversas e dados do CRM
  const loadData = async (preselectPhone?: string) => {
    try {
      setLoading(true)
      setLoadError(null)

      const [ptsRes, apptsRes, tplsRes, cfgRes] = await Promise.allSettled([
        getPatients(),
        getAppointments(),
        Promise.resolve(getInboxTemplates()),
        getWhatsAppConfig(),
      ])

      const pts = ptsRes.status === 'fulfilled' ? ptsRes.value || [] : []
      const appts = apptsRes.status === 'fulfilled' ? apptsRes.value || [] : []
      const tpls = tplsRes.status === 'fulfilled' ? tplsRes.value || [] : getInboxTemplates()
      const cfg = cfgRes.status === 'fulfilled' ? cfgRes.value : null

      setPatients(pts)
      setAppointments(appts)
      setTemplates(tpls)
      if (cfg) setWaConfig(cfg)

      const convList = await getInboxConversations(pts).catch(() => [])
      setConversations(convList)

      // Seleção da conversa
      const targetPhone = preselectPhone || stateNav?.selectPhone
      if (targetPhone) {
        const found = convList.find(
          (c) =>
            c.phone.replace(/\D/g, '').endsWith(targetPhone.replace(/\D/g, '')) ||
            targetPhone.replace(/\D/g, '').endsWith(c.phone.replace(/\D/g, '')),
        )
        if (found) {
          setActiveConversationId(found.id)
        } else if (convList.length > 0) {
          setActiveConversationId(convList[0].id)
        }
      } else if (!activeConversationId && convList.length > 0) {
        setActiveConversationId(convList[0].id)
      }
    } catch (err: any) {
      console.error('Erro ao carregar Inbox:', err)
      setLoadError('Não foi possível carregar as conversas no momento.')
      toast({ title: 'Erro ao carregar conversas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Atualizações em tempo real com PocketBase
  useRealtime('whatsapp_messages', () => {
    getInboxConversations(patients).then(setConversations).catch(console.error)
  })

  // Encontra a conversa ativa atual
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || conversations[0] || null
  }, [conversations, activeConversationId])

  // Carrega histórico de mensagens da conversa selecionada
  useEffect(() => {
    if (!activeConversation) {
      setActiveMessages([])
      return
    }

    let isMounted = true
    getConversationMessages(
      activeConversation.id,
      activeConversation.phone,
      activeConversation.patient?.id || activeConversation.patientId,
    ).then((msgs) => {
      if (isMounted) {
        setActiveMessages(msgs)
        // Scroll para o fim
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    })

    return () => {
      isMounted = false
    }
  }, [activeConversation])

  // Scroll automático para o final ao chegar nova mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  // Filtragem de conversas na barra lateral
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    const q = searchQuery.toLowerCase()
    return conversations.filter((c) => {
      const matchPhone = c.phone.toLowerCase().includes(q)
      const matchContact = c.contactName?.toLowerCase().includes(q)
      const matchPatient = c.patientName?.toLowerCase().includes(q)
      const matchLastMsg = c.lastMessage?.content?.toLowerCase().includes(q)
      return matchPhone || matchContact || matchPatient || matchLastMsg
    })
  }, [conversations, searchQuery])

  // Próximo agendamento do paciente vinculado
  const activePatientNextAppointment = useMemo(() => {
    if (!activeConversation?.patient) return null
    const pId = activeConversation.patient.id
    return (
      appointments
        .filter((a) => a.patient === pId && (a.status === 'agendado' || a.status === 'confirmado'))
        .sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())[0] ||
      null
    )
  }, [activeConversation, appointments])

  // Manipulador de envio de resposta
  const handleSendMessage = async () => {
    if (!activeConversation || !replyText.trim()) return

    setSending(true)
    try {
      const sent = await sendInboxMessage({
        conversationId: activeConversation.id,
        phone: activeConversation.phone,
        content: replyText,
        patientId: activeConversation.patient?.id || activeConversation.patientId,
        senderName: 'Recepção Cliap',
      })

      // Atualiza localmente o chat
      setActiveMessages((prev) => [...prev, sent])
      setReplyText('')

      if (waConfig?.status === 'conectado') {
        toast({
          title: 'Mensagem enviada com sucesso!',
          description: 'Processada via WhatsApp Cloud API oficial.',
        })
      } else {
        toast({
          title: 'WhatsApp aberto com sucesso!',
          description: 'Mensagem enviada via deep link e gravada no histórico.',
        })
      }

      // Recarrega conversas para atualizar a última mensagem
      const updated = await getInboxConversations(patients)
      setConversations(updated)
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  // Aplica um template diretamente no campo de resposta
  const handleApplyTemplate = (tpl: InboxMessageTemplate) => {
    const formatted = formatInboxTemplate(tpl.content, {
      patient: activeConversation?.patient,
      appointment: activePatientNextAppointment,
      customVars: {
        vacina: 'Pentavalente (3ª dose)',
        data_vacina: '18/09/2026',
      },
    })
    setReplyText(formatted)
    toast({
      title: `Template "${tpl.title}" aplicado`,
      description: 'Variáveis do paciente preenchidas automaticamente. Revise e envie.',
    })
  }

  // Formatação de data/hora para a lista e balões
  const formatTimeOrDate = (isoStr?: string) => {
    if (!isoStr) return ''
    const date = new Date(isoStr)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const formatFullDateTime = (isoStr?: string) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return (
    <div className="space-y-4">
      {/* Banner explicativo de envio por deep link & dados de exemplo */}
      <div className="rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50/90 via-sky-50/70 to-emerald-50/80 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-800 text-white shrink-0 mt-0.5">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#1F3A4D]">
                  Inbox WhatsApp • Cliap Pediatria e Imunização
                </h2>
                {waConfig?.status === 'conectado' ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Meta Cloud API Conectada
                  </Badge>
                ) : waConfig?.status === 'erro' ? (
                  <Badge
                    variant="outline"
                    className="bg-rose-100 text-rose-800 border-rose-300 text-[11px] font-semibold"
                  >
                    Cloud API: Erro / Fallback Ativo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-slate-100 text-slate-700 border-slate-300 text-[11px] font-semibold"
                  >
                    Integração Desconectada (Deep Link Ativo)
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="bg-amber-100/80 text-amber-900 border-amber-300 text-[11px] font-semibold"
                >
                  Mensagens Inbound + Exemplos
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Visualização unificada de conversas da recepção, vinculação automática com a ficha
                do paciente por telefone e envio via Cloud API oficial ou deep link de contingência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <Link to="/configuracoes-whatsapp">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-slate-300 hover:bg-white text-slate-700 h-8"
                title="Configurações da Meta Cloud API"
              >
                <Settings2 className="h-3.5 w-3.5 mr-1 text-teal-800" />
                Configurar API
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData()}
              className="text-xs border-slate-300 hover:bg-white text-slate-700 h-8"
              title="Recarregar conversas e mensagens"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Atualizar
            </Button>
            <Link to="/whatsapp">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-teal-300 text-teal-800 hover:bg-teal-100/50 h-8 font-medium"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                Centro Avançado
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Container Principal estilo WhatsApp Web */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden min-h-[580px] lg:h-[calc(100vh-230px)] lg:max-h-[860px]">
        {/* ========================================================= */}
        {/* COLUNA ESQUERDA: LISTA DE CONVERSAS (4 colunas no lg) */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/60">
          {/* Header da lista de conversas */}
          <div className="p-3.5 border-b border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#1F3A4D]">Conversas Recentes</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 font-semibold"
                >
                  {filteredConversations.length}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-teal-800 hover:bg-teal-50 px-2"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nova Conversa
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">Iniciar com Paciente:</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {patients.slice(0, 5).map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => {
                        const found = conversations.find(
                          (c) =>
                            c.patient?.id === p.id ||
                            c.phone.replace(/\D/g, '') === p.phone.replace(/\D/g, ''),
                        )
                        if (found) {
                          setActiveConversationId(found.id)
                        } else {
                          // Abre link e seleciona em nova aba
                          const link = buildWhatsAppLink(p.phone)
                          openWhatsAppExternal(link)
                          toast({ title: `WhatsApp aberto para ${p.parent_name || p.full_name}` })
                        }
                      }}
                      className="text-xs cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5 mr-2 text-teal-700" />
                      <div className="truncate">
                        <p className="font-semibold text-slate-800">{p.full_name}</p>
                        <p className="text-[10px] text-slate-500">Resp: {p.parent_name || 'N/A'}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Barra de busca */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por responsável, paciente ou telefone..."
                className="pl-8 h-9 text-xs bg-slate-50/80 border-slate-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Lista de itens de conversa */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadError && !loading ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-amber-600 mx-auto" />
                <p className="text-xs text-slate-600">{loadError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => loadData()}
                  className="text-xs h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Tentar novamente
                </Button>
              </div>
            ) : loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Carregando conversas da recepção...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversation?.id
                const isLinked = !!conv.patient

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 relative ${
                      isActive
                        ? 'bg-teal-50/70 border-l-4 border-teal-800 shadow-inner'
                        : 'hover:bg-white bg-transparent'
                    }`}
                  >
                    {/* Avatar com status de vínculo */}
                    <div className="relative shrink-0">
                      <div
                        className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm ${
                          isLinked
                            ? 'bg-teal-800 text-white shadow-sm'
                            : 'bg-slate-300 text-slate-700'
                        }`}
                      >
                        {conv.contactName
                          ? conv.contactName.charAt(0).toUpperCase()
                          : conv.patientName
                            ? conv.patientName.charAt(0).toUpperCase()
                            : '#'}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center ${
                          isLinked ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        title={
                          isLinked
                            ? 'Número vinculado automaticamente a um paciente do CRM'
                            : 'Número avulso (não cadastrado como responsável)'
                        }
                      >
                        {isLinked ? (
                          <Check className="h-2 w-2 text-white stroke-[3]" />
                        ) : (
                          <span className="block h-1 w-1 bg-white rounded-full" />
                        )}
                      </span>
                    </div>

                    {/* Informações da conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {conv.contactName || formatPhoneNumber(conv.phone)}
                          </p>
                          {isLinked ? (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 bg-teal-50 text-teal-800 border-teal-200 shrink-0 font-medium"
                            >
                              CRM
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 bg-amber-50 text-amber-800 border-amber-200 shrink-0 font-medium"
                            >
                              Novo
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                          {formatTimeOrDate(conv.lastActivity)}
                        </span>
                      </div>

                      {/* Paciente vinculado (se houver) */}
                      {conv.patient && (
                        <p className="text-[11px] text-teal-800 font-medium truncate flex items-center gap-1 mt-0.5">
                          <span>Paciente:</span>
                          <span className="font-semibold">{conv.patient.full_name}</span>
                        </p>
                      )}

                      {!conv.patient && (
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {formatPhoneNumber(conv.phone)}
                        </p>
                      )}

                      {/* Prévia da última mensagem */}
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {conv.lastMessage.direction === 'enviada' && (
                          <span className="text-slate-400 mr-1">Você:</span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                    </div>

                    {/* Badge de não lidas se houver */}
                    {conv.unreadCount > 0 && (
                      <span className="h-4 min-w-[16px] px-1 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUNA DIREITA: CONVERSA ABERTA & HISTÓRICO (8 colunas no lg) */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 flex flex-col bg-[#F7F8FA] min-h-[600px]">
          {activeConversation ? (
            <>
              {/* Header do Chat Ativo */}
              <div className="p-3.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 ${
                      activeConversation.patient ? 'bg-teal-800' : 'bg-slate-500'
                    }`}
                  >
                    {activeConversation.contactName
                      ? activeConversation.contactName.charAt(0).toUpperCase()
                      : '#'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {activeConversation.contactName ||
                          formatPhoneNumber(activeConversation.phone)}
                      </h3>
                      <span className="text-xs font-mono text-slate-500">
                        {formatPhoneNumber(activeConversation.phone)}
                      </span>
                    </div>

                    {/* VINCULAÇÃO AUTOMÁTICA: nome do responsável e link direto para ficha do paciente */}
                    {activeConversation.patient ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap mt-0.5">
                        <span className="inline-flex items-center gap-1 text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          <UserCheck className="h-3 w-3 text-teal-700" />
                          Paciente Vinculado: {activeConversation.patient.full_name}
                        </span>
                        <Link
                          to={`/pacientes/${activeConversation.patient.id}`}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1"
                        >
                          Abrir Prontuário Completo
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 mt-0.5">
                        <UserX className="h-3.5 w-3.5" />
                        <span>Número não cadastrado na base de pacientes.</span>
                        <Link
                          to="/pacientes"
                          className="font-semibold underline hover:text-amber-900 text-[11px]"
                        >
                          Cadastrar Paciente
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações rápidas do cabeçalho da conversa */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {activeConversation.patient && (
                    <Link to={`/pacientes/${activeConversation.patient.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-teal-200 text-teal-800 hover:bg-teal-50"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Ficha do Paciente
                      </Button>
                    </Link>
                  )}

                  <a
                    href={buildWhatsAppLink(activeConversation.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Abrir no App
                    </Button>
                  </a>
                </div>
              </div>

              {/* Informação contextual de agendamento (se houver) */}
              {activePatientNextAppointment && (
                <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 flex items-center justify-between text-xs text-sky-900">
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                    <span className="truncate">
                      Próxima consulta:{' '}
                      <strong>
                        {new Date(activePatientNextAppointment.date_time).toLocaleDateString(
                          'pt-BR',
                        )}{' '}
                        às{' '}
                        {new Date(activePatientNextAppointment.date_time).toLocaleTimeString(
                          'pt-BR',
                          { hour: '2-digit', minute: '2-digit' },
                        )}
                      </strong>{' '}
                      ({activePatientNextAppointment.type})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const tpl = templates.find((t) => t.type === 'lembrete_24h') || templates[0]
                      if (tpl) handleApplyTemplate(tpl)
                    }}
                    className="h-6 text-[11px] text-sky-800 hover:bg-sky-100 font-semibold px-2 shrink-0"
                  >
                    Inserir Lembrete 24h
                  </Button>
                </div>
              )}

              {/* ÁREA DE MENSAGENS (estilo balões WhatsApp) */}
              <div
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#EFEAE2] bg-opacity-95"
                style={{
                  backgroundImage:
                    'radial-gradient(#d4cbbe 0.75px, transparent 0.75px), radial-gradient(#d4cbbe 0.75px, #efeae2 0.75px)',
                  backgroundSize: '30px 30px',
                  backgroundPosition: '0 0, 15px 15px',
                }}
              >
                {/* Data de início do histórico */}
                <div className="flex justify-center my-2">
                  <span className="bg-white/90 backdrop-blur-xs text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs border border-slate-200/80">
                    Histórico de Mensagens WhatsApp
                  </span>
                </div>

                {activeMessages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 bg-white/70 backdrop-blur-xs rounded-xl p-6 max-w-sm mx-auto shadow-xs border">
                    Nenhuma mensagem anterior registrada para este contato. Utilize o campo abaixo
                    para iniciar a conversa pelo WhatsApp.
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isOutbound = msg.direction === 'enviada'

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs relative ${
                            isOutbound
                              ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs border border-[#c3f0bb]'
                              : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200'
                          }`}
                        >
                          {/* Remetente */}
                          <div className="flex items-center justify-between gap-3 text-[10px] mb-1 font-semibold">
                            <span className={isOutbound ? 'text-emerald-800' : 'text-teal-800'}>
                              {msg.senderName || (isOutbound ? 'Recepção Cliap' : 'Contato')}
                            </span>
                            <span className="text-slate-400 font-normal">
                              {formatTimeOrDate(msg.timestamp)}
                            </span>
                          </div>

                          {/* Conteúdo textual da mensagem com quebras de linha preservadas */}
                          <p className="whitespace-pre-line leading-relaxed text-[12px] text-slate-800 font-sans">
                            {msg.content}
                          </p>

                          {/* Rodapé do balão: hora exata e checks */}
                          <div className="flex items-center justify-end gap-1 mt-1 pt-0.5 text-[9px] text-slate-400">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOutbound && (
                              <CheckCheck className="h-3 w-3 text-emerald-600 inline" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* BARRA INFERIOR: SELETOR DE TEMPLATES E DIGITAÇÃO DE RESPOSTA */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2">
                {/* Barra de atalhos rápidos de Templates */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center mr-1">
                    <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                    Modelos rápidos:
                  </span>

                  {templates.map((tpl) => (
                    <Button
                      key={tpl.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="h-7 text-[11px] px-2.5 py-0 border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 shrink-0 rounded-full"
                    >
                      {tpl.type === 'lembrete_24h' && (
                        <Calendar className="h-3 w-3 mr-1 text-blue-600" />
                      )}
                      {tpl.type === 'alerta_vacina' && (
                        <Syringe className="h-3 w-3 mr-1 text-purple-600" />
                      )}
                      {tpl.type === 'boas_vindas' && (
                        <Smile className="h-3 w-3 mr-1 text-amber-600" />
                      )}
                      {tpl.type === 'confirmacao' && (
                        <CheckCheck className="h-3 w-3 mr-1 text-emerald-600" />
                      )}
                      {tpl.title}
                    </Button>
                  ))}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 text-teal-800 hover:bg-teal-50 shrink-0"
                      >
                        Ver todos...
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel className="text-xs">
                        Templates Disponíveis
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {templates.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onClick={() => handleApplyTemplate(t)}
                          className="text-xs cursor-pointer flex flex-col items-start py-2"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-semibold text-slate-800">{t.title}</span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 bg-slate-100"
                            >
                              {t.category}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate w-full mt-0.5">
                            {t.description}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Caixa de digitação e botão de envio */}
                <div className="flex items-end gap-2">
                  <Textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Digite a resposta diretamente pelo CRM (Shift+Enter para nova linha)..."
                    className="min-h-[50px] max-h-[140px] text-xs leading-relaxed resize-y bg-slate-50/70 border-slate-300 focus:bg-white"
                  />

                  <Button
                    type="button"
                    disabled={sending || !replyText.trim()}
                    onClick={handleSendMessage}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-medium flex items-center"
                    title={
                      waConfig?.status === 'conectado'
                        ? 'Enviar instantaneamente via Meta Cloud API'
                        : 'Enviar via deep link do WhatsApp oficial'
                    }
                  >
                    {waConfig?.status === 'conectado' ? (
                      <Zap className="h-4 w-4 mr-1.5 text-amber-300 fill-amber-300" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    {waConfig?.status === 'conectado' ? 'Enviar Direto' : 'Enviar'}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
                  <span>
                    Destinatário:{' '}
                    <strong className="text-slate-600">
                      {activeConversation.contactName || activeConversation.phone}
                    </strong>{' '}
                    ({formatPhoneNumber(activeConversation.phone)})
                  </span>
                  <span>O envio dispara o WhatsApp oficial com o texto preenchido</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <MessageSquare className="h-12 w-12 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Nenhuma conversa selecionada</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Selecione uma conversa ao lado para visualizar o histórico completo de mensagens ou
                iniciar um novo atendimento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
