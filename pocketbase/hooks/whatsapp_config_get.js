routerAdd(
  'GET',
  '/backend/v1/whatsapp/config',
  (e) => {
    let settingRecord = null
    try {
      const records = $app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        settingRecord = records[0]
      }
    } catch (err) {
      $app.logger().error('Erro ao buscar whatsapp_settings', 'error', String(err))
    }

    if (!settingRecord) {
      // Cria registro se não existir
      try {
        const col = $app.findCollectionByNameOrId('whatsapp_settings')
        const newRec = new Record(col)
        newRec.set('app_id', '1124393106909237')
        newRec.set('phone_number_id', '')
        newRec.set('waba_id', '')
        newRec.set('access_token', '')
        newRec.set('webhook_verify_token', $security.randomString(24))
        newRec.set('status', 'desconectado')
        $app.save(newRec)
        settingRecord = newRec
      } catch (err2) {
        return e.json(500, { error: 'Falha ao inicializar configurações de WhatsApp.' })
      }
    }

    const token = settingRecord.getString('access_token') || ''
    const hasToken = token.trim().length > 0
    let maskedToken = ''
    if (hasToken) {
      if (token.length > 8) {
        maskedToken = '••••••••••••••••' + token.slice(-6)
      } else {
        maskedToken = '••••••••'
      }
    }

    let webhookVerifyToken = settingRecord.getString('webhook_verify_token') || ''
    if (!webhookVerifyToken) {
      try {
        webhookVerifyToken = $security.randomString(24)
        settingRecord.set('webhook_verify_token', webhookVerifyToken)
        $app.save(settingRecord)
      } catch (_) {}
    }

    return e.json(200, {
      id: settingRecord.id,
      app_id: settingRecord.getString('app_id') || '1124393106909237',
      phone_number_id: settingRecord.getString('phone_number_id') || '',
      waba_id: settingRecord.getString('waba_id') || '',
      has_token: hasToken,
      masked_token: maskedToken,
      display_phone_number: settingRecord.getString('display_phone_number') || '',
      verified_name: settingRecord.getString('verified_name') || '',
      quality_rating: settingRecord.getString('quality_rating') || '',
      webhook_verify_token: webhookVerifyToken,
      status: settingRecord.getString('status') || 'desconectado',
      last_tested_at: settingRecord.getString('last_tested_at') || null,
      last_error: settingRecord.getString('last_error') || '',
    })
  },
  $apis.requireAuth(),
)
