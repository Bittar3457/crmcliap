migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('whatsapp_messages')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['rascunho', 'agendada', 'enviada', 'falha']
      statusField.maxSelect = 1
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('whatsapp_messages')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['rascunho', 'agendada', 'enviada']
      statusField.maxSelect = 1
      app.save(col)
    }
  },
)
