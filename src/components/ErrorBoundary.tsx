import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo)
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-10 text-center animate-fade-in my-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-sm mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {this.props.fallbackTitle || 'Ocorreu um erro ao carregar esta seção'}
          </h3>

          <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            Houve uma instabilidade temporária ao processar os dados ou renderizar os elementos da
            tela. Nenhum dado do paciente foi perdido.
          </p>

          {this.state.error?.message && (
            <div className="mt-3 max-w-lg rounded-lg bg-white/80 p-2.5 text-xs text-rose-800 border border-rose-200/80 font-mono text-left break-words overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={this.handleRetry}
              className="bg-[#1F3A4D] hover:bg-[#2A4B63] text-white shadow-sm"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/painel'
              }}
              className="border-slate-300 text-slate-700 hover:bg-white"
            >
              <Home className="mr-2 h-4 w-4" />
              Ir para o Painel
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
