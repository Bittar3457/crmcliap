migrate(
  (app) => {
    const templates = new Collection({
      name: 'message_templates',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['confirmacao', 'lembrete', 'orientacao', 'livre'],
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_message_templates_type ON message_templates (type)'],
    })
    app.save(templates)

    const defaultTemplates = [
      {
        type: 'confirmacao',
        title: 'Confirmação de Consulta',
        description: 'Enviado para confirmar presença na próxima consulta agendada.',
        order: 1,
        content: `Olá, {{responsavel}}! Tudo bem?

Aqui é da equipe Cliap (Pediatria e Imunização). Estamos entrando em contato para confirmar a consulta de {{paciente}} agendada para {{data}} às {{hora}}.

Poderia, por gentileza, nos confirmar se podemos manter o agendamento? Responda SIM para confirmar ou nos avise caso necessite remarcar.

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
      },
      {
        type: 'lembrete',
        title: 'Lembrete de Consulta / Horário',
        description: 'Lembrete de horário, documentação e orientações de pontualidade.',
        order: 2,
        content: `Olá, {{responsavel}}! Tudo bem?

Lembramos que a consulta de {{paciente}} na Cliap Pediatria e Imunização está agendada para {{data}} às {{hora}}.

Pedimos a gentileza de chegar com 10 minutos de antecedência e trazer a carteirinha de vacinação. Caso ocorra algum imprevisto, favor nos avisar com antecedência. Até breve!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
      },
      {
        type: 'orientacao',
        title: 'Orientação Pediátrica',
        description: 'Utilizado com a biblioteca de orientações ou instruções gerais.',
        order: 3,
        content: `Olá, {{responsavel}}!

Seguem as orientações de cuidados da Cliap para {{paciente}}:

{{orientacao}}

Qualquer dúvida ou intercorrência, nossa equipe está à total disposição para auxiliar!

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
      },
      {
        type: 'livre',
        title: 'Mensagem Livre',
        description: 'Template base para mensagens personalizadas avulsas.',
        order: 4,
        content: `Olá, {{responsavel}}! Tudo bem?

Aqui é da equipe Cliap (Pediatria e Imunização).

{{conteudo}}

Atenciosamente,
Equipe Cliap • Pediatria e Imunização`,
      },
    ]

    for (const item of defaultTemplates) {
      try {
        app.findFirstRecordByData('message_templates', 'type', item.type)
      } catch (_) {
        const record = new Record(templates)
        record.set('type', item.type)
        record.set('title', item.title)
        record.set('description', item.description)
        record.set('order', item.order)
        record.set('content', item.content)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('message_templates')
      app.delete(col)
    } catch (_) {}
  },
)
