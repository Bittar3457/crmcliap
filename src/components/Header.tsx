import { useState } from 'react'
import { Search, Menu, LogOut, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { GlobalSearchModal } from './GlobalSearchModal'

interface HeaderProps {
  title: string
  onOpenMobileNav: () => void
}

export function Header({ title, onOpenMobileNav }: HeaderProps) {
  const { user, signOut } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-6 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileNav}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
          <h1 className="text-lg md:text-xl font-semibold text-slate-800 tracking-tight">
            {title}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center space-x-2 text-slate-500 hover:text-slate-900 border-slate-200 bg-slate-50"
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">Buscar paciente...</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="sm:hidden"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5 text-slate-700" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border border-slate-200">
                  <AvatarFallback className="bg-emerald-800 text-white font-medium text-xs">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-slate-900">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <GlobalSearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
