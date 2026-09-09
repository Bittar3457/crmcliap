import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Phone,
  ShieldCheck,
  Send,
  Copy,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Activity,
  Layers,
  Inbox,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from '@/components/ui/use-toast'
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  testWhatsAppConnection,
  getWebhookCallbackUrl,
  type WhatsAppConfig,
} from '@/services/whatsapp-api'

export default function WhatsAppSettings() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [copiedWebhook, setCopiedWebhook] = useState(false)
  const [copiedVerifyToken, setCopiedVerifyToken] = useState(false)

  const [appId, setAppId] = useState('1124393106909237')
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [wabaId, setWabaId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [webhookVerifyToken, setWebhookVerifyToken] = useState('')

  const [testResult, setTestResult] = useState<{
    success: boolean
    message?: string
    error?: string
    status?: string
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
  } | null>(null)

  const webhookUrl = getWebhookCallbackUrl()

  const loadConfigData = async () => {
    try {
      const data = await getWhatsAppConfig()
      setConfig(data)
      setAppId(data.app_id || '1124393106909237')
      setPhoneNumberId(data.phone_number_id || '')
      setWabaId(data.waba_id || '')
      setWebhookVerifyToken(data.webhook_verify_token || '')
      setAccessToken('')
    } catch (err) {
      console.error('Erro ao carregar configurações de WhatsApp:', err)
      toast({
        title: 'Erro ao carregar configurações',
        description: 'Verifique a conexão com o servidor.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    loadConfigData()
  }, [])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    try {
      const payload: {
        app_id: string
        phone_number_id: string
        waba_id: string
        webhook_verify_token: string
        access_token?: string
      } = {
        app_id: appId,
        phone_number_id: phoneNumberId,
        waba_id: wabaId,
        webhook_verify_token: webhookVerifyToken,
      }

      if (accessToken.trim()) {
        payload.access_token = accessToken.trim()
      }

      const updated = await saveWhatsAppConfig(payload)
      setConfig(updated)
      setAccessToken('')
      toast({
        title: 'Configurações salvas com sucesso!',
        description: 'Credenciais armazenadas com segurança no backend.',
      })
    } catch (err: unknown) {
      console.error(err)
      toast({
        title: 'Erro ao salvar',
        description: (err as Error)?.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      if (accessToken.trim() || phoneNumberId !== (config?.phone_number_id || '')) {
        await saveWhatsAppConfig({
          app_id: appId,
          phone_number_id: phoneNumberId,
          waba_id: wabaId,
          access_token: accessToken.trim() || undefined,
          webhook_verify_token: webhookVerifyToken,
        })
        setAccessToken('')
      }

      const res = await testWhatsAppConnection()
      setTestResult(res)

      const refreshed = await getWhatsAppConfig()
      setConfig(refreshed)

      if (res.success) {
        toast({
          title: 'Conexão bem-sucedida!',
          description: `Token permanente válido. Linha: ${res.display_phone_number || res.verified_name || 'Detectada'}.`,
        })
      } else {
        toast({
          title: 'Falha no teste de conexão',
          description: res.error || 'Verifique o token e as permissões no Meta for Developers.',
          variant: 'destructive',
        })
      }
    } catch (err: unknown) {
      console.error(err)
      setTestResult({
        success: false,
        error: (err as Error)?.message || 'Falha ao executar teste.',
      })
      toast({
        title: 'Erro no teste',
        description: (err as Error)?.message || 'Erro inesperado.',
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string, isWebhook: boolean) => {
    navigator.clipboard.writeText(text)
    if (isWebhook) {
      setCopiedWebhook(true)
      setTimeout(() => setCopiedWebhook(false), 2000)
    } else {
      setCopiedVerifyToken(true)
      setTimeout(() => setCopiedVerifyToken(false), 2000)
    }
    toast({ title: 'Copiado para a área de transferência!' })
  }

  const statusBadge = () => {
    const st = config?.status || 'desconectado'
    if (st === 'conectado') {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1.5 px-3 py-1 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Conectada ao WhatsApp Cloud API
        </Badge>
      )
    }
    if (st === 'erro') {
      return (
        <Badge className="bg-rose-100 text-rose-800 border-rose-300 gap-1.5 px-3 py-1 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Erro na Conexão / Token Expirado
        </Badge>
      )
    }
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-300 gap-1.5 px-3 py-1 text-xs font-semibold">
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        Desconectada (Fallback Deep Link Ativo)
      </Badge>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-[#1F3A4D]">
              Integração WhatsApp Business Cloud API
            </h2>
            {statusBadge()}
          </div>
          <p className="text-sm text-slate-500">
            Configure as credenciais seguras da Meta para envio e recepção automatizados no CRM
            Cliap Pediatria
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link to="/whatsapp">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 border-slate-300">
              <Send className="h-3.5 w-3.5 mr-1 text-teal-800" />
              Centro WhatsApp
            </Button>
          </Link>
          <Link to="/inbox-whatsapp">
            <Button variant="outline" size="sm" className="text-xs text-slate-700 border-slate-300">
              <Inbox className="h-3.5 w-3.5 mr-1 text-teal-800" />
              Inbox WhatsApp
            </Button>
          </Link>
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50/70 text-amber-900">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <AlertTitle className="font-bold text-amber-900 text-sm flex items-center gap-2">
          Conta Meta em Verificação / Análise em Andamento
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-800 bg-amber-100/60 text-[10px]"
          >
            App ID 1124393106909237
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-xs text-amber-800 mt-1 space-y-1">
          <p>
            A conta do WhatsApp Business da Cliap foi criada e está passando por análise da Meta.
            Durante esse período ou caso ainda não tenha forma de pagamento cadastrada, a Meta pode
            restringir envios diretos a números de teste ou templates pré-aprovados.
          </p>
          <p className="font-semibold text-amber-900">
            ✓ O CRM Cliap possui fallback inteligente: se a API da Meta recusar o envio, o sistema
            avisa graciosamente e oferece o botão para envio imediato via WhatsApp oficial (deep
            link).
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-teal-800" />
                    Credenciais de Servidor da Meta Cloud API
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Armazenamento seguro em collection protegida do PocketBase com restrição total
                    ao browser
                  </CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-teal-50 text-teal-800">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="app-id" className="text-xs font-semibold text-slate-700">
                    Meta App ID
                  </Label>
                  <Input
                    id="app-id"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="Ex: 1124393106909237"
                    className="font-mono text-xs bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400">
                    Identificador da aplicação criada no portal Meta for Developers.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="access-token" className="text-xs font-semibold text-slate-700">
                      Token de Acesso Permanente (System User Token) *
                    </Label>
                    {config?.has_token && (
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Token configurado no backend ({config.masked_token})
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      id="access-token"
                      type={showTokenInput ? 'text' : 'password'}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder={
                        config?.has_token
                          ? 'Token já cadastrado (digite novo apenas para substituir)'
                          : 'Cole aqui o token de acesso permanente da Meta Cloud API (EAAG...)'
                      }
                      className="font-mono text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showTokenInput ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Lock className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>
                      O token é criptografado e transmitido diretamente ao servidor. O browser nunca
                      recebe o token completo de volta.
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone-number-id" className="text-xs font-semibold text-slate-700">
                    Phone Number ID (Identificador do Número de Telefone) *
                  </Label>
                  <Input
                    id="phone-number-id"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="Ex: 104829375829104"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Encontrado no painel da Meta em WhatsApp &gt; Configuração da API &gt; "ID do
                    número de telefone". Usado na rota de envio:{' '}
                    <code className="text-teal-800">POST /{'{phone_number_id}'}/messages</code>
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="waba-id" className="text-xs font-semibold text-slate-700">
                    WhatsApp Business Account ID (WABA ID - Opcional)
                  </Label>
                  <Input
                    id="waba-id"
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    placeholder="Ex: 928374619283746"
                    className="font-mono text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#1F3A4D] hover:bg-[#162A38] text-white text-xs h-9 px-4 font-medium"
                  >
                    {saving ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Salvar Credenciais
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || (!config?.has_token && !accessToken.trim())}
                    className="border-teal-300 text-teal-800 hover:bg-teal-50 text-xs h-9 px-4 font-semibold"
                  >
                    {testing ? (
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Activity className="h-3.5 w-3.5 mr-1.5 text-teal-700" />
                    )}
                    Testar Conexão com Graph API
                  </Button>
                </div>
              </form>

              {testResult && (
                <div
                  className={`mt-4 p-3.5 rounded-xl border text-xs space-y-2 ${
                    testResult.success
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {testResult.success ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.message || testResult.error}</span>
                  </div>

                  {testResult.success && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-500">Número detectado:</span>{' '}
                        <strong>{testResult.display_phone_number || 'Não informado'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Nome verificado:</span>{' '}
                        <strong>{testResult.verified_name || 'Cliap Pediatria'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Qualidade da linha:</span>{' '}
                        <Badge
                          variant="secondary"
                          className="bg-emerald-200/80 text-emerald-900 text-[10px] px-1.5 py-0"
                        >
                          {testResult.quality_rating || 'GREEN (Ótima)'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-slate-500">Status Graph API:</span>{' '}
                        <strong className="text-emerald-700">Autenticado com sucesso</strong>
                      </div>
                    </div>
                  )}

                  {!testResult.success && testResult.error && (
                    <p className="text-[11px] text-rose-800">
                      Detalhes do erro:{' '}
                      <code className="bg-rose-100/60 p-0.5 rounded">{testResult.error}</code>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-subtle">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-800" />
                Linha Oficial de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Telefone Exibido:</span>
                <span className="font-semibold text-slate-800">
                  {config?.display_phone_number ||
                    (phoneNumberId ? 'Detectando via teste...' : 'Não configurado')}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Nome Verificado:</span>
                <span className="font-semibold text-slate-800">
                  {config?.verified_name || 'Cliap Pediatria e Imunização'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Classificação de Qualidade:</span>
                <span className="font-semibold text-emerald-700">
                  {config?.quality_rating || 'Em avaliação'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500">Último Teste:</span>
                <span className="text-[11px] text-slate-600">
                  {config?.last_tested_at
                    ? new Date(config.last_tested_at).toLocaleString('pt-BR')
                    : 'Nunca executado'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-subtle bg-slate-50/50">
            <CardHeader className="pb-3 border-b border-slate-200">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal-800" />
                Webhook Inbound (Recebimento de Mensagens)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Configure estes dados no portal da Meta para que respostas dos responsáveis caiam
                diretamente na Inbox
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    URL de Callback (Callback URL)
                  </Label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, true)}
                    className="text-[10px] text-teal-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedWebhook ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedWebhook ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all">
                  {webhookUrl}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Token de Verificação (Verify Token)
                  </Label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookVerifyToken, false)}
                    className="text-[10px] text-teal-800 hover:underline flex items-center gap-1 font-medium"
                  >
                    {copiedVerifyToken ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedVerifyToken ? 'Copiado!' : 'Copiar Token'}
                  </button>
                </div>
                <Input
                  value={webhookVerifyToken}
                  onChange={(e) => setWebhookVerifyToken(e.target.value)}
                  className="font-mono text-xs bg-white"
                />
              </div>

              <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-[11px] text-teal-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-teal-700" />
                  Passo a passo no painel Meta for Developers:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                  <li>
                    Acesse o app <strong>1124393106909237</strong> &gt; WhatsApp &gt; Configuração
                  </li>
                  <li>
                    Na seção "Webhook", clique em <strong>Editar</strong>
                  </li>
                  <li>
                    Cole a <strong>URL de Callback</strong> e o <strong>Verify Token</strong> acima
                  </li>
                  <li>
                    Clique em <strong>Verificar e Salvar</strong>
                  </li>
                  <li>
                    Em Campos de Webhook, assine o campo <code>messages</code>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
