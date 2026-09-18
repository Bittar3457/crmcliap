migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('waba_id', '1354766836641766')
        record.set('phone_number_id', '1354063401113389')
        // Limpa campos de cache do último teste de conexão da linha anterior
        record.set('display_phone_number', '')
        record.set('verified_name', '')
        record.set('quality_rating', '')
        record.set('last_tested_at', null)
        record.set('last_error', '')
        app.save(record)
      }
    } catch (err) {
      console.log('Erro ao atualizar whatsapp_settings na migration 0005:', err)
    }
  },
  (app) => {
    // Reversão opcional (não crítico se down não for chamado)
    try {
      const records = app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        const record = records[0]
        record.set('waba_id', '1631378888770924')
        record.set('phone_number_id', '1336482172880489')
        app.save(record)
      }
    } catch (_) {}
  },
)
