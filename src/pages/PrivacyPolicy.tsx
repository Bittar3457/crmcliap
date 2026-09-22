import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  FileText,
  Mail,
  CheckCircle,
  Database,
  Share2,
  UserCheck,
  Clock,
  Sparkles,
} from 'lucide-react'
import { CliapLogo } from '@/components/CliapLogo'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicy() {
  const lastUpdated = '18 de outubro de 2024'
  const dpoEmail = 'robertobittar98@gmail.com'

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      {/* Cabeçalho minimalista */}
      <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-20 backdrop-blur-xs">
        <div className="max-w-[760px] mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <CliapLogo iconSize="h-8 w-8" />
          </Link>
          <Link to="/login">
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-[#1F3A4D] border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Conteúdo Centralizado max 760px */}
      <main className="max-w-[760px] mx-auto px-4 py-10 sm:py-14 leading-relaxed">
        {/* Badge e Título */}
        <div className="mb-10 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-4">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
            <span>Conformidade com a LGPD (Lei nº 13.709/2018)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1F3A4D] tracking-tight">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Cliap • Pediatria e Imunização • Última atualização: <strong>{lastUpdated}</strong>
          </p>
        </div>

        <div className="space-y-8 text-slate-700 text-sm leading-relaxed">
          {/* Apresentação */}
          <section className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="font-medium text-slate-900">
              A <strong>Cliap — Pediatria e Imunização</strong> assume o compromisso irrevogável de
              proteger a privacidade, o sigilo médico e os dados pessoais de seus pacientes
              pediátricos, pais e responsáveis legais, em inteira consonância com a Lei Geral de
              Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e as resoluções do Conselho
              Federal de Medicina (CFM).
            </p>
            <p className="text-xs text-slate-600">
              Esta política esclarece de forma transparente como coletamos, utilizamos, armazenamos,
              compartilhamos e protegemos suas informações em nossos canais de atendimento e no
              sistema CRM.
            </p>
          </section>

          {/* 1. Quais dados são coletados */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Database className="h-5 w-5 text-teal-800 shrink-0" />
              1. Dados Pessoais Coletados
            </h2>
            <p>
              Para prestar serviços de saúde pediátrica e manter o acompanhamento contínuo dos
              pacientes, coletamos as seguintes categorias de informações:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>Identificação do Paciente (Criança/Adolescente):</strong> Nome completo,
                data de nascimento, sexo, tipo sanguíneo e histórico de atendimento médico.
              </li>
              <li>
                <strong>Identificação dos Pais ou Responsáveis Legais:</strong> Nome completo,
                número de telefone celular (WhatsApp), endereço de e-mail e endereço residencial.
              </li>
              <li>
                <strong>Dados Médicos e Cartão Vacinal (Dados Sensíveis de Saúde):</strong> Registro
                de vacinas administradas e aprazadas (doses, datas, lotes), histórico clínico
                pediátrico, alergias, observações médicas relevantes e orientações pós-vacinais.
              </li>
              <li>
                <strong>Comunicações e Mensagens:</strong> Histórico das interações de confirmação
                de consultas, lembretes de horários e orientações de cuidados trocadas com a
                recepção e equipe da clínica.
              </li>
            </ul>
          </section>

          {/* 2. Finalidades do Tratamento */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText className="h-5 w-5 text-teal-800 shrink-0" />
              2. Finalidades do Tratamento de Dados
            </h2>
            <p>
              Os dados tratados pela Cliap têm finalidades estritamente legítimas e assistenciais:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-900 text-xs mb-1">
                  Agendamento & Consultas
                </h3>
                <p className="text-xs text-slate-600">
                  Gerenciar a agenda de consultas pediátricas, retornos, vacinações e
                  teleatendimentos.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-900 text-xs mb-1">
                  Lembretes & Alertas via WhatsApp
                </h3>
                <p className="text-xs text-slate-600">
                  Enviar confirmações prévias (24 horas antes) e avisos sobre doses do calendário
                  vacinal.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-900 text-xs mb-1">
                  Prontuário & Histórico Clínico
                </h3>
                <p className="text-xs text-slate-600">
                  Manter o prontuário eletrônico seguro para acompanhamento longitudinal do
                  desenvolvimento.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <h3 className="font-semibold text-slate-900 text-xs mb-1">
                  Orientações de Cuidados
                </h3>
                <p className="text-xs text-slate-600">
                  Disponibilizar orientações pós-vacina, medicamentos e cuidados pediátricos
                  individualizados.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Base Legal */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Lock className="h-5 w-5 text-teal-800 shrink-0" />
              3. Bases Legais (Artigos 7º, 11 e 14 da LGPD)
            </h2>
            <p>
              O tratamento das informações dos pacientes é amparado pelas seguintes bases legais da
              LGPD:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>
                  Tutela da Saúde e Execução de Serviços de Saúde (Art. 7º, VIII e Art. 11, II,
                  'f'):
                </strong>{' '}
                procedimento realizado por profissionais de saúde e entidades sanitárias para
                proteção da vida e integridade física.
              </li>
              <li>
                <strong>Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II):</strong> guarda
                de prontuários médicos pelo prazo mínimo determinado pelo Conselho Federal de
                Medicina (CFM) e Ministério da Saúde.
              </li>
              <li>
                <strong>Consentimento Específico e em Destaque (Art. 14, §1º):</strong> por envolver
                crianças e adolescentes, o tratamento de dados cadastrais para comunicação é
                autorizado expressamente por pelo menos um dos pais ou responsável legal.
              </li>
            </ul>
          </section>

          {/* 4. Uso do WhatsApp e Meta Cloud API */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Share2 className="h-5 w-5 text-teal-800 shrink-0" />
              4. Integração WhatsApp e Meta Cloud API
            </h2>
            <p>
              A Cliap utiliza a <strong>WhatsApp Cloud API oficial da Meta Platforms, Inc.</strong>{' '}
              para agilizar a comunicação, envio de lembretes e suporte receptivo aos pais e
              responsáveis:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <p>
                • As mensagens trocadas via API transitam pela infraestrutura segura e criptografada
                da Meta Platforms, Inc., atuando na condição de operadora de processamento de
                infraestrutura de mensageria.
              </p>
              <p>
                • As mensagens trafegam com canais criptografados de ponta a ponta e conforme as
                políticas de privacidade da Meta para mensagens empresariais (Business Messaging).
              </p>
              <p>
                • Quando o envio automatizado pela API oficial estiver indisponível ou for recusado
                pela plataforma (ex.: restrições de janela de 24h ou modo de homologação), o
                atendimento pode ser direcionado com contingência via WhatsApp Web com o
                consentimento do operador.
              </p>
            </div>
          </section>

          {/* 5. Compartilhamento e Não Venda de Dados */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserCheck className="h-5 w-5 text-teal-800 shrink-0" />
              5. Compartilhamento de Dados e Não Comercialização
            </h2>
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              A Cliap NUNCA vende, aluga, cede ou comercializa dados pessoais de pacientes ou
              responsáveis para terceiros ou fins publicitários.
            </div>
            <p>O compartilhamento restringe-se unicamente ao estritamente indispensável para:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
              <li>
                <strong>Prestadores de Infraestrutura Essenciais:</strong> Hospedagem em nuvem de
                alta segurança (Skip Cloud / PocketBase) e infraestrutura de mensageria (Meta
                Platforms).
              </li>
              <li>
                <strong>Autoridades Sanitárias e Judiciais:</strong> Apenas mediante obrigação legal
                expressa ou notificação compulsória nos termos da legislação de saúde pública.
              </li>
            </ul>
          </section>

          {/* 6. Direitos do Titular de Dados */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <CheckCircle className="h-5 w-5 text-teal-800 shrink-0" />
              6. Seus Direitos como Titular (Art. 18 da LGPD)
            </h2>
            <p>
              O titular dos dados ou seu representante legal tem o direito de requerer, a qualquer
              momento e gratuitamente:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
              <li>
                <strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento e
                acessar os dados cadastrais e de histórico da clínica.
              </li>
              <li>
                <strong>Correção:</strong> Solicitar a retificação de dados incompletos, inexatos ou
                desatualizados.
              </li>
              <li>
                <strong>Revogação de Consentimento:</strong> Revogar a autorização de recebimento de
                comunicações não obrigatórias via WhatsApp.
              </li>
              <li>
                <strong>Eliminação de Dados:</strong> Requerer a exclusão de dados tratados com base
                em consentimento, observados os prazos legais de retenção de prontuários médicos.
              </li>
              <li>
                <strong>Portabilidade:</strong> Solicitar cópia dos dados em formato interoperável.
              </li>
            </ul>
          </section>

          {/* 7. Retenção e Segurança */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock className="h-5 w-5 text-teal-800 shrink-0" />
              7. Retenção e Medidas de Segurança
            </h2>
            <p>
              Os prontuários médicos e dados clínicos são armazenados pelo prazo mínimo de 20
              (vinte) anos a partir do último registro, em conformidade com o Artigo 6º da Lei nº
              13.787/2018 e resoluções do CFM.
            </p>
            <p>
              Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais de
              acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda ou
              alteração, incluindo controle restrito de acesso por credenciais seguras, criptografia
              em repouso e em trânsito (TLS/HTTPS).
            </p>
          </section>

          {/* 8. Encarregado de Proteção de Dados (DPO) */}
          <section className="space-y-3 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-bold text-[#1F3A4D] flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-800 shrink-0" />
              8. Canal de Contato do Encarregado de Dados (DPO)
            </h2>
            <p>
              Para esclarecer dúvidas, exercer qualquer um dos seus direitos de titular ou tratar de
              questões relacionadas a esta Política de Privacidade, entre em contato diretamente com
              o nosso Encarregado de Proteção de Dados:
            </p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  Encarregado pelo Tratamento de Dados Pessoais (DPO):
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  Cliap • Gestão e Proteção de Dados
                </p>
                <p className="text-xs text-teal-800 font-mono mt-0.5">{dpoEmail}</p>
              </div>
              <a
                href={`mailto:${dpoEmail}?subject=LGPD%20-%20Solicita%C3%A7%C3%A3o%20de%20Titular%20de%20Dados%20Cliap`}
                className="shrink-0"
              >
                <Button
                  size="sm"
                  className="bg-[#1F3A4D] hover:bg-[#2A4B63] text-white text-xs rounded-lg"
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Entrar em Contato
                </Button>
              </a>
            </div>
          </section>
        </div>

        {/* Rodapé da página */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} Cliap • Pediatria e Imunização. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-[#1F3A4D] font-medium hover:underline">
              Acesso ao Sistema
            </Link>
            <Link to="/cadastro" className="text-[#1F3A4D] font-medium hover:underline">
              Cadastro de Profissional
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
