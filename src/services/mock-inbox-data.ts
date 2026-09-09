import type { WhatsAppChatMessage, InboxMessageTemplate } from '@/types/whatsapp-inbox'

/**
 * Templates padrão de mensagem da Cliap Pediatria e Imunização,
 * incluindo os 3 templates automáticos solicitados:
 * 1. Lembrete de consulta 24 horas antes do agendamento
 * 2. Lembrete de vacina quando uma dose está próxima do vencimento do aprazamento
 * 3. Mensagem de boas-vindas para novos pacientes
 */
export const INBOX_TEMPLATES: InboxMessageTemplate[] = [
  {
    id: 'tpl_lembrete_24h',
    type: 'lembrete_24h',
    category: 'automatico',
    title: 'Lembrete de Consulta 24h',
    badgeLabel: 'Disparo 24h Antes',
    description: 'Enviado automaticamente 24 horas antes da consulta agendada na Cliap.',
    content: `Olá, {{responsavel}}! Tudo bem?

Lembramos que a consulta de {{paciente}} na Cliap Pediatria e Imunização está agendada para amanhã, dia {{data}} às {{hora}}.

📍 Unidade Cliap: Av. Paulista, 1000 - Cj. 42
👶 Pedimos a gentileza de chegar com 10 minutos de antecedência e trazer a carteirinha de vacinação e documentos da criança.

Por favor, responda com "SIM" para confirmar ou nos avise caso necessite remarcar. Até breve!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
  },
  {
    id: 'tpl_alerta_vacina',
    type: 'alerta_vacina',
    category: 'automatico',
    title: 'Alerta de Vacina por Aprazamento',
    badgeLabel: 'Aprazamento Vacinal',
    description: 'Enviado quando uma dose de vacina do paciente está próxima do vencimento.',
    content: `Olá, {{responsavel}}! Tudo bem?

Passando para lembrar que {{paciente}} tem uma dose da vacina {{vacina}} prevista para {{data_vacina}}, dentro do calendário de imunização infantil.

Manter a carteirinha em dia é fundamental para a proteção e saúde do seu pequeno(a)!

Deseja que já reservemos um horário para a aplicação da dose na nossa sala de vacinas? Responda a esta mensagem ou ligue para nós.

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
  },
  {
    id: 'tpl_boas_vindas',
    type: 'boas_vindas',
    category: 'automatico',
    title: 'Boas-Vindas Novo Paciente',
    badgeLabel: 'Novos Pacientes',
    description: 'Enviado para acolhimento de famílias recém-cadastradas na Cliap.',
    content: `Olá, {{responsavel}}! Seja muito bem-vindo(a) à família Cliap • Pediatria e Imunização! 🌟

É uma imensa alegria cuidar da saúde, desenvolvimento e proteção de {{paciente}}.

Nosso canal do WhatsApp está à sua inteira disposição para:
• Agendamento de consultas pediátricas e de puericultura
• Aplicação de vacinas do calendário infantil e especial
• Orientações de cuidados e pós-consulta

Qualquer dúvida ou necessidade, estamos aqui para acolher sua família com todo o carinho e dedicação que vocês merecem!

Com carinho,
Equipe Cliap • Pediatria e Imunização`,
  },
  {
    id: 'tpl_confirmacao',
    type: 'confirmacao',
    category: 'manual',
    title: 'Confirmação de Consulta',
    badgeLabel: 'Confirmação',
    description: 'Enviado para confirmação ativa de agendamento.',
    content: `Olá, {{responsavel}}! Tudo bem?

Aqui é da equipe Cliap (Pediatria e Imunização). Estamos entrando em contato para confirmar a consulta de {{paciente}} agendada para {{data}} às {{hora}}.

Poderia, por gentileza, nos confirmar se podemos manter o agendamento? Responda SIM para confirmar ou nos avise caso necessite remarcar.

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
  },
  {
    id: 'tpl_orientacao',
    type: 'orientacao',
    category: 'manual',
    title: 'Orientação Pediátrica',
    badgeLabel: 'Cuidados Pediátricos',
    description: 'Orientações clínicas e recomendações médicas pós-consulta.',
    content: `Olá, {{responsavel}}!

Seguem as orientações de cuidados da Cliap para {{paciente}}:

{{orientacao}}

Qualquer dúvida ou intercorrência, nossa equipe está à total disposição para auxiliar!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
  },
]

/**
 * 3 Conversas mockadas de exemplo para a Inbox:
 * 1. Ana Silva (número cadastrado: +5511999999999, vinculada à paciente Maria Clara Silva)
 * 2. Roberto Bittar (número cadastrado: 5511999403804, vinculado ao paciente Roberto Bittar)
 * 3. Número NÃO cadastrado no CRM (+5511987654321, demonstra o caso do número puro / novo contato)
 */
export const MOCK_CONVERSATIONS: Array<{
  id: string
  phone: string
  contactName?: string
  patientId?: string
  patientName?: string
  unreadCount?: number
  lastActivity: string
  messages: WhatsAppChatMessage[]
}> = [
  {
    id: 'conv-ana-silva',
    phone: '+5511999999999',
    contactName: 'Ana Silva',
    patientName: 'Maria Clara Silva',
    // O ID da paciente Maria Clara no banco é e7eubrhfkvqhno8
    patientId: 'e7eubrhfkvqhno8',
    unreadCount: 1,
    lastActivity: '2026-09-06T14:45:00.000Z',
    messages: [
      {
        id: 'msg-ana-1',
        conversationId: 'conv-ana-silva',
        patientId: 'e7eubrhfkvqhno8',
        phone: '+5511999999999',
        content:
          'Olá, equipe Cliap! A Maria Clara tomou a vacina da Febre Amarela semana passada e está tudo bem. Gostaria de saber quando podemos agendar o retorno de rotina dela.',
        direction: 'recebida',
        timestamp: '2026-09-05T09:20:00.000Z',
        status: 'lida',
        senderName: 'Ana Silva',
      },
      {
        id: 'msg-ana-2',
        conversationId: 'conv-ana-silva',
        patientId: 'e7eubrhfkvqhno8',
        phone: '+5511999999999',
        content:
          'Olá, Ana! Que ótima notícia! Podemos agendar o retorno para o próximo dia 15/08 às 14h com a Dra. Mariana. Fica bom para vocês?',
        direction: 'enviada',
        timestamp: '2026-09-05T09:35:00.000Z',
        status: 'lida',
        senderName: 'Recepção Cliap',
      },
      {
        id: 'msg-ana-3',
        conversationId: 'conv-ana-silva',
        patientId: 'e7eubrhfkvqhno8',
        phone: '+5511999999999',
        content:
          'Fica ótimo sim! Podem confirmar esse horário por favor. Ela precisa de algum jejum ou exame antes?',
        direction: 'recebida',
        timestamp: '2026-09-06T14:45:00.000Z',
        status: 'lida',
        senderName: 'Ana Silva',
      },
    ],
  },
  {
    id: 'conv-roberto-bittar',
    phone: '5511999403804',
    contactName: 'Roberto Bittar',
    patientName: 'Roberto Bittar',
    // O ID do paciente Roberto no banco é r1iw8j8ekes7ux5
    patientId: 'r1iw8j8ekes7ux5',
    unreadCount: 0,
    lastActivity: '2026-09-06T12:10:00.000Z',
    messages: [
      {
        id: 'msg-rob-1',
        conversationId: 'conv-roberto-bittar',
        patientId: 'r1iw8j8ekes7ux5',
        phone: '5511999403804',
        content:
          'Boa tarde! Gostaria de confirmar as orientações de antitérmico para o meu neto, vocês poderiam me enviar novamente por favor?',
        direction: 'recebida',
        timestamp: '2026-09-06T11:45:00.000Z',
        status: 'lida',
        senderName: 'Roberto Bittar',
      },
      {
        id: 'msg-rob-2',
        conversationId: 'conv-roberto-bittar',
        patientId: 'r1iw8j8ekes7ux5',
        phone: '5511999403804',
        content:
          'Olá, Roberto! Enviamos as instruções detalhadas de medicamentos antitérmicos: respeitar intervalo mínimo de 6 horas e calcular conforme o peso da última consulta. Estamos à disposição caso a febre persista!',
        direction: 'enviada',
        timestamp: '2026-09-06T12:10:00.000Z',
        status: 'lida',
        senderName: 'Recepção Cliap',
      },
    ],
  },
  {
    id: 'conv-numero-desconhecido',
    phone: '+5511987654321',
    // Contato SEM vínculo inicial no CRM para demonstrar o caso de número puro
    contactName: undefined,
    patientName: undefined,
    patientId: undefined,
    unreadCount: 2,
    lastActivity: '2026-09-06T15:20:00.000Z',
    messages: [
      {
        id: 'msg-desc-1',
        conversationId: 'conv-numero-desconhecido',
        phone: '+5511987654321',
        content:
          'Olá! Gostaria de saber se vocês atendem convênio Unimed para primeira consulta de recém-nascido (15 dias de vida)? Meu nome é Juliana.',
        direction: 'recebida',
        timestamp: '2026-09-06T15:15:00.000Z',
        status: 'lida',
        senderName: '+55 (11) 98765-4321',
      },
      {
        id: 'msg-desc-2',
        conversationId: 'conv-numero-desconhecido',
        phone: '+5511987654321',
        content: 'Vocês também realizam o teste do pezinho ampliado e a vacina BCG na clínica?',
        direction: 'recebida',
        timestamp: '2026-09-06T15:20:00.000Z',
        status: 'lida',
        senderName: '+55 (11) 98765-4321',
      },
    ],
  },
]
