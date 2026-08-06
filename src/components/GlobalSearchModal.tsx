import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Phone, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getPatients } from '@/services/patients'
import type { Patient } from '@/types/crm'
import { formatPhoneNumber } from '@/lib/whatsapp-utils'

interface GlobalSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearchModal({ open, onOpenChange }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await getPatients(query)
        setResults(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, open])

  const handleSelect = (patientId: string) => {
    onOpenChange(false)
    navigate(`/pacientes/${patientId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-base font-semibold text-slate-800">
            Buscar Paciente
          </DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite nome, responsável ou telefone..."
              className="pl-9"
              autoFocus
            />
          </div>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center p-6 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Buscando pacientes...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center p-6 text-sm text-slate-500">
              {query ? 'Nenhum paciente encontrado.' : 'Digite para iniciar a busca.'}
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelect(patient.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-teal-50/60 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-medium text-xs">
                      {patient.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{patient.full_name}</p>
                      <p className="text-xs text-slate-500">Resp: {patient.parent_name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <Phone className="h-3 w-3 mr-1 text-teal-700" />
                    {formatPhoneNumber(patient.phone)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
