import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Cross, Lock, Mail, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (password !== passwordConfirm) {
      setErrorMsg('As senhas não coincidem.')
      return
    }

    if (password.length < 8) {
      setErrorMsg('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)

    if (error) {
      setErrorMsg(getErrorMessage(error) || 'Falha ao criar conta.')
    } else {
      navigate('/painel')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:w-1/2 bg-gradient-to-br from-[#0f3d3e] to-[#145a5a] text-white p-8 md:p-12 flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-teal-300">
            <Cross className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-lg font-bold">Clínica de Pediatria</span>
            <span className="block text-xs text-teal-200">e Imunização Pediátrica</span>
          </div>
        </div>

        <div className="my-12 md:my-auto max-w-md space-y-4">
          <h2 className="text-3xl font-extrabold">Cadastro de Profissional</h2>
          <p className="text-slate-200 text-sm">
            Crie sua conta corporativa para gerenciar pacientes, agendamentos e automação de
            orientações médicas.
          </p>
        </div>

        <div className="text-xs text-teal-300/80">© Clínica de Pediatria e Imunização</div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Criar Nova Conta</h3>
            <p className="mt-1 text-sm text-slate-500">Preencha os dados do profissional</p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr(a). Nome Sobrenome"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail Profissional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@clinica.com"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha (mín. 8 caracteres)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#145a5a] hover:bg-[#1f7a7a] text-white font-medium py-2.5 rounded-lg"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar Conta e Acessar
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Já possui conta?{' '}
            <Link to="/login" className="text-teal-800 font-semibold hover:underline">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
