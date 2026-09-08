import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom'
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { CliapLogo } from '@/components/CliapLogo'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const { token: paramToken } = useParams<{ token?: string }>()
  const queryToken = searchParams.get('token')
  const initialToken = queryToken || paramToken || ''

  const [token, setToken] = useState(initialToken)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token && (queryToken || paramToken)) {
      setToken(queryToken || paramToken || '')
    }
  }, [queryToken, paramToken, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!token.trim()) {
      setErrorMsg(
        'Token de segurança não encontrado ou inválido. Acesse através do link enviado ao seu e-mail.',
      )
      return
    }

    if (password.length < 8) {
      setErrorMsg('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setErrorMsg('As senhas digitadas não coincidem.')
      return
    }

    setLoading(true)
    const { error } = await confirmPasswordReset(token.trim(), password)
    setLoading(false)

    if (error) {
      const msg = getErrorMessage(error)
      if (msg && msg.toLowerCase().includes('token')) {
        setErrorMsg(
          'Este link de recuperação expirou ou já foi utilizado. Solicite um novo link na tela de login.',
        )
      } else {
        setErrorMsg(msg || 'Falha ao redefinir a senha. Verifique o link e tente novamente.')
      }
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Coluna Esquerda: Branding Cliap */}
      <div className="md:w-1/2 bg-gradient-to-br from-[#1F3A4D] via-[#2A4B63] to-[#44586C] text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <CliapLogo variant="dark" iconSize="h-11 w-11" />
        </div>

        <div className="my-12 md:my-auto z-10 max-w-md">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs text-slate-100 mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-[#B06A5E]" />
            <span>Segurança e Privacidade</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Redefinição Segura de Senha.
          </h2>
          <p className="mt-4 text-slate-200 text-sm leading-relaxed">
            Mantenha seu acesso ao CRM da Cliap sempre protegido. Escolha uma nova senha forte com
            no mínimo 8 caracteres.
          </p>
        </div>

        <div className="text-xs text-slate-300/80 z-10">
          © Cliap Pediatria e Imunização • Central de Segurança de Acesso.
        </div>
      </div>

      {/* Coluna Direita: Formulário */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="md:hidden mb-6">
              <CliapLogo iconSize="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">
              {success ? 'Senha Alterada!' : 'Definir Nova Senha'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {success
                ? 'Sua nova senha foi atualizada com sucesso.'
                : 'Cadastre sua nova senha de acesso ao sistema Cliap.'}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>Atualização concluída com sucesso!</span>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Agora você já pode fazer login na plataforma utilizando sua nova credencial de
                  acesso.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-[#1F3A4D] hover:bg-[#2A4B63] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Ir para o Login</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {!token && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block mb-0.5">
                      Token não detectado na URL
                    </strong>
                    <span>
                      Você pode colar manualmente o código/token que recebeu no seu e-mail no campo
                      abaixo ou clicar diretamente no botão do e-mail de recuperação.
                    </span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!initialToken && (
                  <div className="space-y-1.5">
                    <Label htmlFor="token">Código de Redefinição (Token)</Label>
                    <Input
                      id="token"
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Cole aqui o token recebido por e-mail"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 8 caracteres"
                      className="pl-9 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordConfirm">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="passwordConfirm"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="pl-9"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1F3A4D] hover:bg-[#2A4B63] text-white font-medium py-2.5 rounded-lg transition-all shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Nova Senha
                </Button>
              </form>

              <div className="text-center pt-2 text-xs text-slate-500">
                Lembrou da senha anterior?{' '}
                <Link to="/login" className="text-[#1F3A4D] font-semibold hover:underline">
                  Voltar para o Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
