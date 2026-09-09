routerAdd(
  'POST',
  '/backend/v1/whatsapp/config',
  (e) => {
    const body = e.requestInfo().body || {}

    let settingRecord = null
    try {
      const records = $app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        settingRecord = records[0]
      }
    } catch (err) {
      $app.logger().error('Erro ao buscar whatsapp_settings para update', 'error', String(err))
    }

    if (!settingRecord) {
      try {
        const col = $app.findCollectionByNameOrId('whatsapp_settings')
        settingRecord = new Record(col)
        settingRecord.set('status', 'desconectado')
      } catch (err2) {
        return e.json(500, { error: 'Falha ao instanciar registro de configuração.' })
      }
    }

    if (body.app_id !== undefined) {
      settingRecord.set('app_id', String(body.app_id).trim())
    }
    if (body.phone_number_id !== undefined) {
      settingRecord.set('phone_number_id', String(body.phone_number_id).trim())
    }
    if (body.waba_id !== undefined) {
      settingRecord.set('waba_id', String(body.waba_id).trim())
    }
    if (body.webhook_verify_token !== undefined && String(body.webhook_verify_token).trim()) {
      settingRecord.set('webhook_verify_token', String(body.webhook_verify_token).trim())
    } else if (!settingRecord.getString('webhook_verify_token')) {
      settingRecord.set('webhook_verify_token', $security.randomString(24))
    }

    // Apenas atualiza o access_token se foi fornecido um valor não mascarado e não vazio
    if (body.access_token !== undefined) {
      const newTok = String(body.access_token).trim()
      if (newTok && !newTok.startsWith('•••')) {
        settingRecord.set('access_token', newTok)
      }
    }

    try {
      $app.save(settingRecord)
    } catch (saveErr) {
      return e.json(400, { error: 'Falha ao salvar configurações: ' + String(saveErr) })
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

    return e.json(200, {
      id: settingRecord.id,
      app_id: settingRecord.getString('app_id') || '',
      phone_number_id: settingRecord.getString('phone_number_id') || '',
      waba_id: settingRecord.getString('waba_id') || '',
      has_token: hasToken,
      masked_token: maskedToken,
      display_phone_number: settingRecord.getString('display_phone_number') || '',
      verified_name: settingRecord.getString('verified_name') || '',
      quality_rating: settingRecord.getString('quality_rating') || '',
      webhook_verify_token: settingRecord.getString('webhook_verify_token') || '',
      status: settingRecord.getString('status') || 'desconectado',
      last_tested_at: settingRecord.getString('last_tested_at') || null,
      last_error: settingRecord.getString('last_error') || '',
      message: 'Configurações de WhatsApp salvas com sucesso.',
    })
  },
  $apis.requireAuth(),
)
