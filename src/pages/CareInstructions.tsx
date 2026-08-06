import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, Plus, Sparkles, Send, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { getCareInstructions, searchCareInstructions } from '@/services/care-instructions'
import type { CareInstruction, InstructionCategory } from '@/types/crm'
import { CareInstructionModal } from '@/components/CareInstructionModal'

const categories: { label: string; value: string }[] = [
  { label: 'Todas', value: 'todos' },
  { label: 'Pós-Vacina', value: 'pos_vacina' },
  { label: 'Geral/Febre', value: 'geral' },
  { label: 'Medicamentos', value: 'medicamento' },
  { label: 'Nutrição', value: 'nutricao' },
  { label: 'Acompanhamento', value: 'acompanhamento' },
]

export default function CareInstructions() {
  const [instructions, setInstructions] = useState<CareInstruction[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedInstruction, setSelectedInstruction] = useState<CareInstruction | null>(null)

  const navigate = useNavigate()

  const loadData = async () => {
    try {
      if (searchQuery.trim()) {
        setSearching(true)
        const results = await searchCareInstructions(searchQuery)
        setInstructions(results)
      } else {
        const data = await getCareInstructions(selectedCategory)
        setInstructions(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedCategory])

  const handleSendViaWhatsApp = (inst: CareInstruction) => {
    navigate('/whatsapp', { state: { instructionId: inst.id } })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Biblioteca de Orientações Pediátricas
          </h2>
          <p className="text-sm text-slate-500">
            Instruções pré-configuradas para envio automatizado
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedInstruction(null)
            setModalOpen(true)
          }}
          className="bg-teal-800 hover:bg-teal-900 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Orientação
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Busca semântica por conceito (ex.: 'febre alta', 'amamentação')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white"
          />
          {searching && (
            <span className="absolute right-3 top-2.5 text-xs text-teal-800 flex items-center">
              <Sparkles className="h-3.5 w-3.5 animate-spin mr-1" /> Buscando com IA...
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(cat.value)
              }}
              className={
                selectedCategory === cat.value && !searchQuery
                  ? 'bg-teal-800 text-white'
                  : 'text-slate-600 border-slate-200'
              }
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border">
            Nenhuma orientação encontrada.
          </div>
        ) : (
          instructions.map((inst) => (
            <Card
              key={inst.id}
              className="border-slate-200 shadow-subtle flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded uppercase">
                      {inst.category.replace('_', ' ')}
                    </span>
                    {inst._distance !== undefined && (
                      <span className="text-[10px] text-slate-400 flex items-center">
                        <Sparkles className="h-3 w-3 mr-0.5 text-amber-500" /> Semântica
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 mt-2 text-base">{inst.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-4 leading-relaxed whitespace-pre-line">
                    {inst.content}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInstruction(inst)
                      setModalOpen(true)
                    }}
                    className="text-xs text-slate-600"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendViaWhatsApp(inst)}
                    className="bg-teal-800 hover:bg-teal-900 text-white text-xs"
                  >
                    <Send className="h-3 w-3 mr-1" /> Enviar via WA
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CareInstructionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        instruction={selectedInstruction}
        onSuccess={loadData}
      />
    </div>
  )
}
