import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Syringe,
  BookOpen,
  MessageSquare,
  Cross,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  onItemClick?: () => void
}

const navItems = [
  { label: 'Painel', href: '/painel', icon: LayoutDashboard },
  { label: 'Pacientes', href: '/pacientes', icon: Users },
  { label: 'Agendamentos', href: '/agendamentos', icon: Calendar },
  { label: 'Vacinações', href: '/vacinacoes', icon: Syringe },
  { label: 'Orientações', href: '/orientacoes', icon: BookOpen },
  { label: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
]

export function Sidebar({ onItemClick }: SidebarProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex h-16 items-center px-6 border-b border-slate-100">
        <Link to="/painel" className="flex items-center space-x-3" onClick={onItemClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-800 text-white shadow-sm">
            <Cross className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-900 leading-tight">
              Clínica Pediatria
            </span>
            <span className="block text-[11px] font-medium text-teal-800">e Imunização</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative',
                isActive
                  ? 'bg-teal-50 text-teal-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-teal-800" />
              )}
              <Icon
                className={cn(
                  'mr-3 h-5 w-5 transition-colors',
                  isActive ? 'text-teal-800' : 'text-slate-400 group-hover:text-slate-600',
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {user?.name || 'Médico(a)'}
            </p>
            <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
