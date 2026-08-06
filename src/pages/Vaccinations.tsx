import { useState, useEffect } from 'react'
import { Syringe, Plus, Search, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { getVaccinations } from '@/services/vaccinations'
import type { Vaccination } from '@/types/crm'
import { VaccinationFormModal } from '@/components/VaccinationFormModal'
import { useRealtime } from '@/hooks/use-realtime'

export default function Vaccinations() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const loadVaccines = async () => {
    try {
      const data = await getVaccinations()
      setVaccinations(data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadVaccines()
  }, [])

  useRealtime('vaccinations', () => loadVaccines())

  const filtered = vaccinations.filter((v) => {
    const pName = v.expand?.patient?.full_name || ''
    const vName = v.vaccine_name || ''
    return (
      pName.toLowerCase().includes(search.toLowerCase()) ||
      vName.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cartão Vacinal & Registro</h2>
          <p className="text-sm text-slate-500">Acompanhamento e imunização de crianças</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-teal-800 hover:bg-teal-900 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Vacina
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Filtrar por vacina ou paciente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border">
            Nenhuma vacina registrada ou encontrada.
          </div>
        ) : (
          filtered.map((v) => (
            <Card key={v.id} className="border-slate-200 shadow-subtle">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                      <Syringe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{v.vaccine_name}</h3>
                      <p className="text-xs text-slate-500">{v.dose || '1ª dose'}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
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

                <div className="border-t border-slate-100 pt-3 text-xs space-y-1 text-slate-600">
                  <p>
                    <strong className="text-slate-800">Paciente:</strong>{' '}
                    {v.expand?.patient?.full_name || 'Paciente'}
                  </p>
                  <p>
                    <strong className="text-slate-800">Data Prevista:</strong>{' '}
                    {v.scheduled_date
                      ? new Date(v.scheduled_date).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </p>
                  {v.administered_date && (
                    <p className="text-emerald-700">
                      <strong>Aplicada em:</strong>{' '}
                      {new Date(v.administered_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {v.notes && <p className="text-slate-500 italic mt-1">{v.notes}</p>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <VaccinationFormModal open={modalOpen} onOpenChange={setModalOpen} onSuccess={loadVaccines} />
    </div>
  )
}
