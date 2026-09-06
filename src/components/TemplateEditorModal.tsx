import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Copy,
  CalendarCheck,
  Bell,
  BookOpen,
  MessageSquare,
  HelpCircle,
  Eye,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import type { MessageTemplate, MessageTemplateType } from '@/types/crm'
import {
  TEMPLATE_VARIABLES_INFO,
  DEFAULT_FALLBACK_TEMPLATES,
  interpolateTemplate,
} from '@/lib/template-interpolator'
import { updateMessageTemplate, createMessageTemplate } from '@/services/message-templates'

interface TemplateEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: MessageTemplate[]
  onTemplatesUpdated: (updatedList: MessageTemplate[]) => void
  initialType?: MessageTemplateType
}

const TEMPLATE_CONFIG: Record<
  MessageTemplateType,
  {
    label: string
    badgeColor: string
    icon: typeof CalendarCheck
    defaultDescription: string
    suggestedVars: string[]
  }
> = {
  confirmacao: {
    label: 'Confirmação',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CalendarCheck,
    defaultDescription: 'Mensagem para confirmar presença e horário da próxima consulta.',
    suggestedVars: ['{{paciente}}', '{{responsavel}}', '{{data}}', '{{hora}}', '{{tipo_consulta}}'],
  },
  lembrete: {
    label: 'Lembrete',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Bell,
    defaultDescription: 'Lembrete de comparecimento, documentação e pontualidade.',
    suggestedVars: ['{{paciente}}', '{{responsavel}}', '{{data}}', '{{hora}}', '{{clinica}}'],
  },
  orientacao: {
    label: 'Orientação',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: BookOpen,
    defaultDescription: 'Modelo para envio de instruções clínicas e pós-vacina da biblioteca.',
    suggestedVars: ['{{paciente}}', '{{responsavel}}', '{{orientacao}}', '{{clinica}}'],
  },
  livre: {
    label: 'Livre',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: MessageSquare,
    defaultDescription:
      'Template para mensagens personalizadas, avisos gerais e comunicados avulsos.',
    suggestedVars: ['{{paciente}}', '{{responsavel}}', '{{conteudo}}', '{{clinica}}'],
  },
}

const SAMPLE_DATA: Record<string, string> = {
  paciente: 'Maria Clara Silva',
  responsavel: 'Ana Silva',
  data: '15/08/2026',
  hora: '14:00',
  tipo_consulta: 'Consulta Pediátrica',
  orientacao:
    'Orientações pós-vacinação:\n1. Aplique compressa fria no local se houver inchaço.\n2. Mantenha hidratação constante.\n3. Se persistir febre, administre o antitérmico prescrito.',
  conteudo:
    'Gostaríamos de avisar que seu exame já se encontra disponível para retirada em nossa recepção.',
  clinica: 'Cliap • Pediatria e Imunização',
}

export function TemplateEditorModal({
  open,
  onOpenChange,
  templates,
  onTemplatesUpdated,
  initialType = 'confirmacao',
}: TemplateEditorModalProps) {
  const [activeTab, setActiveTab] = useState<MessageTemplateType>(initialType)
  const [editForms, setEditForms] = useState<
    Record<MessageTemplateType, { title: string; content: string; description: string }>
  >({
    confirmacao: { title: '', content: '', description: '' },
    lembrete: { title: '', content: '', description: '' },
    orientacao: { title: '', content: '', description: '' },
    livre: { title: '', content: '', description: '' },
  })
  const [savingType, setSavingType] = useState<MessageTemplateType | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  // Atualiza os formulários com os dados atuais quando abrir ou alterar templates
  useEffect(() => {
    const newForms: Record<
      MessageTemplateType,
      { title: string; content: string; description: string }
    > = {
      confirmacao: {
        title: 'Confirmação de Consulta',
        content: DEFAULT_FALLBACK_TEMPLATES.confirmacao,
        description: TEMPLATE_CONFIG.confirmacao.defaultDescription,
      },
      lembrete: {
        title: 'Lembrete de Consulta / Horário',
        content: DEFAULT_FALLBACK_TEMPLATES.lembrete,
        description: TEMPLATE_CONFIG.lembrete.defaultDescription,
      },
      orientacao: {
        title: 'Orientação Pediátrica',
        content: DEFAULT_FALLBACK_TEMPLATES.orientacao,
        description: TEMPLATE_CONFIG.orientacao.defaultDescription,
      },
      livre: {
        title: 'Mensagem Livre',
        content: DEFAULT_FALLBACK_TEMPLATES.livre,
        description: TEMPLATE_CONFIG.livre.defaultDescription,
      },
    }

    templates.forEach((tpl) => {
      if (tpl.type in newForms) {
        newForms[tpl.type] = {
          title: tpl.title || newForms[tpl.type].title,
          content: tpl.content ?? newForms[tpl.type].content,
          description: tpl.description || newForms[tpl.type].description,
        }
      }
    })

    setEditForms(newForms)
  }, [templates, open])

  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType)
    }
  }, [initialType, open])

  const handleFieldChange = (
    type: MessageTemplateType,
    field: 'title' | 'content' | 'description',
    value: string,
  ) => {
    setEditForms((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  const handleInsertVariable = (type: MessageTemplateType, tag: string) => {
    setEditForms((prev) => {
      const current = prev[type].content
      const updated = current ? `${current} ${tag}` : tag
      return {
        ...prev,
        [type]: {
          ...prev[type],
          content: updated,
        },
      }
    })
    toast({
      title: 'Variável inserida',
      description: `Marcador ${tag} adicionado ao final do texto.`,
    })
  }

  const handleRestoreDefault = (type: MessageTemplateType) => {
    setEditForms((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        content: DEFAULT_FALLBACK_TEMPLATES[type],
      },
    }))
    toast({
      title: 'Texto padrão restaurado',
      description: 'Lembre-se de clicar em "Salvar Template" para gravar no banco.',
    })
  }

  const handleSave = async (type: MessageTemplateType) => {
    const form = editForms[type]
    const existing = templates.find((t) => t.type === type)

    setSavingType(type)
    try {
      let saved: MessageTemplate
      if (existing) {
        saved = await updateMessageTemplate(existing.id, {
          title: form.title,
          content: form.content,
          description: form.description,
        })
        const updatedList = templates.map((t) => (t.id === existing.id ? saved : t))
        onTemplatesUpdated(updatedList)
      } else {
        const orderMap: Record<MessageTemplateType, number> = {
          confirmacao: 1,
          lembrete: 2,
          orientacao: 3,
          livre: 4,
        }
        saved = await createMessageTemplate({
          type,
          title: form.title || TEMPLATE_CONFIG[type].label,
          content: form.content,
          description: form.description,
          order: orderMap[type] || 1,
        })
        onTemplatesUpdated([...templates, saved])
      }

      toast({
        title: 'Modelo gravado com sucesso!',
        description: `O modelo de ${TEMPLATE_CONFIG[type].label} foi persistido no banco e já será aplicado nos próximos envios.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao gravar modelo',
        description: 'Não foi possível salvar as alterações no banco de dados.',
        variant: 'destructive',
      })
    } finally {
      setSavingType(null)
    }
  }

  const currentConfig = TEMPLATE_CONFIG[activeTab]
  const currentForm = editForms[activeTab]
  const previewText = interpolateTemplate(currentForm?.content || '', SAMPLE_DATA)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 bg-white sm:rounded-2xl border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Modelos de Mensagem do WhatsApp
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Personalize os textos automáticos para os 4 tipos de mensagem. As alterações ficam
                salvas no banco e são aplicadas no Centro de WhatsApp.
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className="text-xs px-2.5 py-1 border-slate-300 text-slate-600 bg-slate-50"
            >
              Banco Skip Cloud
            </Badge>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as MessageTemplateType)}
          className="w-full space-y-4 pt-1"
        >
          <TabsList className="grid grid-cols-4 bg-slate-100/80 p-1 rounded-xl">
            {(
              [
                { id: 'confirmacao', label: 'Confirmação', color: 'border-l-emerald-500' },
                { id: 'lembrete', label: 'Lembrete', color: 'border-l-blue-500' },
                { id: 'orientacao', label: 'Orientação', color: 'border-l-purple-500' },
                { id: 'livre', label: 'Livre', color: 'border-l-slate-400' },
              ] as const
            ).map((item) => {
              const cfg = TEMPLATE_CONFIG[item.id]
              const Icon = cfg.icon
              return (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1F3A4D] data-[state=active]:shadow-sm rounded-lg text-xs font-semibold py-2 flex items-center justify-center gap-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {(['confirmacao', 'lembrete', 'orientacao', 'livre'] as const).map((typeKey) => {
            const form = editForms[typeKey]
            const cfg = TEMPLATE_CONFIG[typeKey]
            const isSaving = savingType === typeKey
            const currentPreview = interpolateTemplate(form.content || '', SAMPLE_DATA)

            return (
              <TabsContent
                key={typeKey}
                value={typeKey}
                className="space-y-4 m-0 focus-visible:outline-none"
              >
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#1F3A4D]">
                        Tipo: {cfg.label}
                      </span>
                      <Badge className={`text-[10px] font-medium border ${cfg.badgeColor}`}>
                        Ativo no Centro de WhatsApp
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{cfg.defaultDescription}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreDefault(typeKey)}
                      className="text-xs h-8 text-slate-600 hover:text-slate-900 border-slate-300"
                      title="Voltar ao modelo original do sistema"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      Restaurar Padrão
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleSave(typeKey)}
                      className="text-xs h-8 bg-[#1F3A4D] hover:bg-[#152734] text-white font-medium"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      {isSaving ? 'Gravando...' : 'Salvar no Banco'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Coluna da esquerda: Editor de texto e campos */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`title-${typeKey}`}
                        className="text-xs font-semibold text-slate-700"
                      >
                        Título de Identificação
                      </Label>
                      <Input
                        id={`title-${typeKey}`}
                        value={form.title}
                        onChange={(e) => handleFieldChange(typeKey, 'title', e.target.value)}
                        placeholder={`Ex.: ${cfg.label} de Consulta`}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor={`content-${typeKey}`}
                          className="text-xs font-semibold text-slate-700"
                        >
                          Corpo do Template *
                        </Label>
                        <span className="text-[11px] text-slate-400">
                          {form.content?.length || 0} caracteres
                        </span>
                      </div>
                      <Textarea
                        id={`content-${typeKey}`}
                        rows={11}
                        value={form.content}
                        onChange={(e) => handleFieldChange(typeKey, 'content', e.target.value)}
                        placeholder="Digite o texto do modelo de mensagem..."
                        className="text-xs font-mono leading-relaxed resize-y border-slate-300 focus:border-[#1F3A4D]"
                      />
                    </div>

                    {/* Barra de variáveis dinâmicas com clique rápido */}
                    <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-900 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                          Variáveis Dinâmicas Disponíveis
                        </span>
                        <span className="text-[10px] text-teal-700">
                          Clique em uma tag para inserir no texto:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPLATE_VARIABLES_INFO.map((v) => {
                          const isSuggested = cfg.suggestedVars.includes(v.tag)
                          return (
                            <button
                              key={v.tag}
                              type="button"
                              onClick={() => handleInsertVariable(typeKey, v.tag)}
                              className={`text-[11px] font-mono px-2 py-1 rounded-md border transition-all ${
                                isSuggested
                                  ? 'bg-teal-100/80 border-teal-300 text-teal-900 hover:bg-teal-200 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                              title={`${v.label}: ${v.description}`}
                            >
                              {v.tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Coluna da direita: Pré-visualização ao vivo com dados de exemplo */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-[#1F3A4D]" />
                          Pré-visualização (Simulação)
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          WhatsApp Real
                        </Badge>
                      </div>

                      <div className="bg-[#EFEAE2] p-3 rounded-lg border border-[#e1ded7] shadow-inner min-h-[220px]">
                        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 space-y-2 max-w-full">
                          <p className="text-[11px] text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                            {currentPreview || (
                              <span className="italic text-slate-400">
                                Nenhum texto definido para este modelo. Digite ao lado para
                                visualizar.
                              </span>
                            )}
                          </p>
                          <div className="flex justify-end pt-1">
                            <span className="text-[9px] text-slate-400">12:30 ✓✓</span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-2.5 border border-slate-200/80 space-y-1.5 text-[11px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Info className="h-3.5 w-3.5 text-blue-600" />
                          Legenda de Variáveis:
                        </span>
                        <ul className="space-y-1 text-slate-500 text-[10px]">
                          <li>
                            <code className="text-teal-800 font-semibold">{'{{paciente}}'}</code>:
                            Substituído por "{SAMPLE_DATA.paciente}"
                          </li>
                          <li>
                            <code className="text-teal-800 font-semibold">{'{{responsavel}}'}</code>
                            : Substituído por "{SAMPLE_DATA.responsavel}"
                          </li>
                          <li>
                            <code className="text-teal-800 font-semibold">{'{{data}}'}</code> e{' '}
                            <code className="text-teal-800 font-semibold">{'{{hora}}'}</code>:
                            Próxima consulta do paciente
                          </li>
                          {typeKey === 'orientacao' && (
                            <li>
                              <code className="text-teal-800 font-semibold">
                                {'{{orientacao}}'}
                              </code>
                              : Conteúdo do modelo de cuidado selecionado
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="text-xs"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave(typeKey)}
                    className="text-xs bg-[#1F3A4D] hover:bg-[#152734] text-white"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {isSaving ? 'Salvando...' : `Salvar "${cfg.label}"`}
                  </Button>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
