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
import { createCareInstruction, updateCareInstruction } from '@/services/care-instructions'
import type { CareInstruction, InstructionCategory } from '@/types/crm'
import { toast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface CareInstructionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instruction?: CareInstruction | null
  onSuccess: () => void
}

export function CareInstructionModal({
  open,
  onOpenChange,
  instruction,
  onSuccess,
}: CareInstructionModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<InstructionCategory>('pos_vacina')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (instruction) {
      setTitle(instruction.title || '')
      setCategory(instruction.category || 'pos_vacina')
      setContent(instruction.content || '')
    } else {
      setTitle('')
      setCategory('pos_vacina')
      setContent('')
    }
  }, [instruction, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast({ title: 'Preencha o título e o conteúdo', variant: 'destructive' })
      return
    }
    setSaving(true)

    const payload = {
      title,
      category,
      content,
      is_template: true,
    }

    try {
      if (instruction) {
        await updateCareInstruction(instruction.id, payload)
        toast({ title: 'Orientação atualizada!' })
      } else {
        await createCareInstruction(payload)
        toast({ title: 'Nova orientação salva na biblioteca!' })
      }
      onSuccess()
      onOpenChange(false)
    } catch {
      toast({ title: 'Erro ao salvar orientação', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">
            {instruction ? 'Editar Modelo de Orientação' : 'Novo Modelo de Orientação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título da Orientação *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Orientações para febre após vacinação"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Categoria *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as InstructionCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pos_vacina">Pós-Vacina</SelectItem>
                <SelectItem value="geral">Cuidados Gerais</SelectItem>
                <SelectItem value="medicamento">Medicamentos</SelectItem>
                <SelectItem value="nutricao">Nutrição e Amamentação</SelectItem>
                <SelectItem value="acompanhamento">Acompanhamento e Retornos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">Texto Completo da Orientação (Pronto para WhatsApp) *</Label>
            <Textarea
              id="content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o texto explicativo completo..."
              required
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
              {instruction ? 'Salvar Alterações' : 'Criar Modelo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
