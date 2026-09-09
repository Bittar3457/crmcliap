migrate(
  (app) => {
    const whatsappSettings = new Collection({
      name: 'whatsapp_settings',
      type: 'base',
      // Trava total no acesso direto do cliente: apenas superuser acessa diretamente pelo SDK
      // As telas do CRM comunicam via pb_hooks autenticados (/backend/v1/whatsapp/...)
      // para NUNCA vazar o token de acesso completo para o browser!
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'app_id', type: 'text' },
        { name: 'phone_number_id', type: 'text' },
        { name: 'waba_id', type: 'text' },
        { name: 'access_token', type: 'text' },
        { name: 'display_phone_number', type: 'text' },
        { name: 'verified_name', type: 'text' },
        { name: 'quality_rating', type: 'text' },
        { name: 'webhook_verify_token', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['desconectado', 'conectado', 'erro'],
          maxSelect: 1,
        },
        { name: 'last_tested_at', type: 'date' },
        { name: 'last_error', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_wa_settings_status ON whatsapp_settings (status)'],
    })
    app.save(whatsappSettings)

    // Seeding de registro padrão inicial único (se não existir)
    const record = new Record(whatsappSettings)
    record.set('app_id', '1124393106909237')
    record.set('phone_number_id', '')
    record.set('waba_id', '')
    record.set('access_token', '')
    record.set('webhook_verify_token', $security.randomString(24))
    record.set('status', 'desconectado')
    app.save(record)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('whatsapp_settings')
      app.delete(col)
    } catch (_) {}
  },
)
