import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const pageTitles: Record<string, string> = {
  '/painel': 'Painel Geral',
  '/pacientes': 'Gestão de Pacientes',
  '/agendamentos': 'Agenda de Consultas e Vacinas',
  '/vacinacoes': 'Cartão e Registro Vacinal',
  '/orientacoes': 'Biblioteca de Orientações',
  '/whatsapp': 'Centro de Mensagens WhatsApp',
}

export default function Layout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  let title = 'Cliap Pediatria'
  for (const [path, t] of Object.entries(pageTitles)) {
    if (location.pathname.startsWith(path)) {
      title = t
      break
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fa]">
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <Sidebar />
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <Sidebar onItemClick={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col md:pl-64">
        <Header title={title} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
        <footer className="py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
          © Cliap • Pediatria e Imunização • Cuidado pediátrico e atendimento humanizado
        </footer>
      </div>
    </div>
  )
}
