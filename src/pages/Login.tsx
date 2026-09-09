import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Lock,
  Mail,
  Loader2,
  HeartHandshake,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { CliapLogo } from '@/components/CliapLogo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modal Esqueci Minha Senha
  const [forgotOpen, setForgotOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')

  const { signIn, requestPasswordReset } = useAuth()
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
      <div className="md:w-1/2 bg-gradient-to-br from-[#1F3A4D] via-[#2A4B63] to-[#44586C] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <CliapLogo variant="dark" iconSize="h-11 w-11" />
        </div>

        <div className="my-12 md:my-auto z-10 max-w-md">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs text-slate-100 mb-4">
            <HeartHandshake className="h-3.5 w-3.5 text-[#B06A5E]" />
            <span>Atendimento Humanizado & WhatsApp</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Cuidado pediátrico com tecnologia e elegância.
          </h2>
          <p className="mt-4 text-slate-200 text-sm leading-relaxed">
            Gestão de pacientes, histórico vacinal completo e respostas automatizadas de orientações
            médicas via WhatsApp da Cliap.
          </p>
        </div>

        <div className="text-xs text-slate-300/80 z-10">
          © Cliap Pediatria e Imunização • Acesso restrito à equipe autorizada.
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="md:hidden mb-6">
              <CliapLogo iconSize="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Acessar CRM Cliap</h3>
            <p className="mt-1 text-sm text-slate-500">
              Entre com suas credenciais cadastradas na Cliap
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail Profissional</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="robertobittar98@gmail.com"
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha de Acesso</Label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email || '')
                    setResetSent(false)
                    setResetError('')
                    setForgotOpen(true)
                  }}
                  className="text-xs font-semibold text-[#1F3A4D] hover:text-[#B06A5E] hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1F3A4D] hover:bg-[#2A4B63] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar no Sistema
            </Button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-500">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-[#1F3A4D] font-semibold hover:underline">
              Criar nova conta
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Esqueci Minha Senha */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200">
          <DialogHeader className="space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#1F3A4D] mb-1">
              <KeyRound className="h-6 w-6 text-[#1F3A4D]" />
            </div>
            <DialogTitle className="text-xl font-bold text-center text-slate-900">
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-center text-slate-600 text-sm">
              Informe seu e-mail cadastrado na Cliap. Enviaremos um link seguro para você redefinir
              sua senha.
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="space-y-5 py-3">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Instruções enviadas!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Se o e-mail informado estiver cadastrado em nossa base, você receberá uma mensagem
                  em instantes com o link seguro para cadastrar uma nova senha.
                </p>
                <p className="text-[11px] text-emerald-600 pt-1">
                  Verifique também sua caixa de spam ou lixo eletrônico.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="w-full bg-[#1F3A4D] hover:bg-[#2A4B63] text-white font-medium rounded-lg"
                >
                  Entendi e vou checar meu e-mail
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setResetSent(false)
                    setResetError('')
                  }}
                  className="w-full text-xs text-slate-600 hover:text-slate-900"
                >
                  Tentar outro e-mail
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setResetError('')
                setResetLoading(true)

                const { error } = await requestPasswordReset(resetEmail.trim())
                setResetLoading(false)

                // Boas práticas de segurança: sempre exibir mensagem de sucesso genérica,
                // prevenindo enumeração de e-mails, exceto se houver erro grave de conexão.
                if (error && error.status && error.status >= 500) {
                  setResetError('Serviço temporariamente indisponível. Tente novamente mais tarde.')
                } else {
                  setResetSent(true)
                }
              }}
              className="space-y-4 pt-2"
            >
              {resetError && (
                <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                  {resetError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reset-email">E-mail Cadastrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu.email@cliap.com.br"
                    className="pl-9"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500">Ex.: robertobittar98@gmail.com</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={resetLoading}
                  className="w-1/3"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-2/3 bg-[#1F3A4D] hover:bg-[#2A4B63] text-white font-medium"
                >
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enviar Link
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
