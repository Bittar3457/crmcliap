import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Cross, Lock, Mail, Loader2, HeartHandshake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setErrorMsg(getErrorMessage(error) || 'E-mail ou senha incorretos.')
    } else {
      navigate('/painel')
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:w-1/2 bg-gradient-to-br from-[#0f3d3e] to-[#145a5a] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center space-x-3 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-800 text-teal-[#2aa198] shadow-md border border-teal-700">
            <Cross className="h-6 w-6 text-teal-300" />
          </div>
          <div>
            <span className="block text-lg font-bold tracking-tight">Clínica de Pediatria</span>
            <span className="block text-xs text-teal-200 font-medium">e Imunização Pediátrica</span>
          </div>
        </div>

        <div className="my-12 md:my-auto z-10 max-w-md">
          <div className="inline-flex items-center space-x-2 bg-teal-900/60 border border-teal-700/50 rounded-full px-3 py-1 text-xs text-teal-200 mb-4">
            <HeartHandshake className="h-3.5 w-3.5 text-teal-400" />
            <span>Atendimento Humanizado & WhatsApp</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Cuidado pediátrico com tecnologia e elegância.
          </h2>
          <p className="mt-4 text-slate-200 text-sm leading-relaxed">
            Gestão de pacientes, histórico vacinal e respostas automatizadas de orientações médicas
            via WhatsApp.
          </p>
        </div>

        <div className="text-xs text-teal-300/80 z-10">
          Acesso restrito à equipe médica e administrativa.
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Acessar CRM Medico</h3>
            <p className="mt-1 text-sm text-slate-500">Entre com suas credenciais cadastradas</p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail Corporativo</Label>
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
              <Label htmlFor="password">Senha de Acesso</Label>
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#145a5a] hover:bg-[#1f7a7a] text-white font-medium py-2.5 rounded-lg transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar no Sistema
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-teal-800 font-semibold hover:underline">
              Criar nova conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
