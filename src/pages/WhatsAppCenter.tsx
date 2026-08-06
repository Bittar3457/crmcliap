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
import { getWhatsAppMessages, createWhatsAppMessage, generateAiDraft } from '@/services/whatsapp'
import type { Patient, CareInstruction, WhatsAppMessage } from '@/types/crm'
import { buildWhatsAppLink, formatPhoneNumber } from '@/lib/whatsapp-utils'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from '@/components/ui/use-toast'

export default function WhatsAppCenter() {
  const location = useLocation()
  const stateNav = location.state as { patientId?: string; instructionId?: string } | null

  const [patients, setPatients] = useState<Patient[]>([])
  const [instructions, setInstructions] = useState<CareInstruction[]>([])
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])

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
      const [pList, iList, mList] = await Promise.all([
        getPatients(),
        getCareInstructions(),
        getWhatsAppMessages(),
      ])
      setPatients(pList)
      setInstructions(iList)
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

  useEffect(() => {
    if (selectedInstructionId) {
      const inst = instructions.find((i) => i.id === selectedInstructionId)
      if (inst) {
        setMessageContent(inst.content)
      }
    }
  }, [selectedInstructionId, instructions])

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
                <Label>Paciente Destinatário *</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
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
                <Label>Modelo de Orientação (Opcional)</Label>
                <Select value={selectedInstructionId} onValueChange={setSelectedInstructionId}>
                  <SelectTrigger>
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
