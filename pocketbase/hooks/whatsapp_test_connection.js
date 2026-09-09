routerAdd(
  'POST',
  '/backend/v1/whatsapp/test-connection',
  (e) => {
    let settingRecord = null
    try {
      const records = $app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        settingRecord = records[0]
      }
    } catch (err) {
      $app.logger().error('Erro ao buscar whatsapp_settings para teste', 'error', String(err))
    }

    if (!settingRecord) {
      return e.json(400, {
        success: false,
        error: 'Nenhuma configuração salva encontrada. Salve os dados antes de testar.',
      })
    }

    const token = settingRecord.getString('access_token') || ''
    const phoneNumberId = settingRecord.getString('phone_number_id') || ''
    const appId = settingRecord.getString('app_id') || ''

    if (!token) {
      settingRecord.set('status', 'desconectado')
      settingRecord.set('last_tested_at', new Date().toISOString())
      settingRecord.set('last_error', 'Token de acesso permanente não configurado.')
      try {
        $app.save(settingRecord)
      } catch (_) {}
      return e.json(400, {
        success: false,
        status: 'desconectado',
        error: 'Token de acesso permanente não configurado.',
      })
    }

    // 1. Testa token com GET https://graph.facebook.com/v21.0/me
    let meResult = null
    try {
      const meRes = $http.send({
        url: 'https://graph.facebook.com/v21.0/me',
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token,
        },
        timeout: 15,
      })

      if (meRes.statusCode >= 200 && meRes.statusCode < 300) {
        meResult = meRes.json
      } else {
        const errMsg =
          meRes.json?.error?.message ||
          'Falha na autenticação do token no Graph API (' + meRes.statusCode + ')'
        settingRecord.set('status', 'erro')
        settingRecord.set('last_tested_at', new Date().toISOString())
        settingRecord.set('last_error', errMsg)
        try {
          $app.save(settingRecord)
        } catch (_) {}
        return e.json(200, {
          success: false,
          status: 'erro',
          error: errMsg,
          details: meRes.json,
        })
      }
    } catch (netErr) {
      const errStr = 'Erro de conexão com Meta Graph API: ' + String(netErr)
      settingRecord.set('status', 'erro')
      settingRecord.set('last_tested_at', new Date().toISOString())
      settingRecord.set('last_error', errStr)
      try {
        $app.save(settingRecord)
      } catch (_) {}
      return e.json(200, {
        success: false,
        status: 'erro',
        error: errStr,
      })
    }

    // 2. Se phone_number_id foi informado, busca os dados da linha (display_phone_number, verified_name, quality_rating)
    let phoneInfo = null
    if (phoneNumberId) {
      try {
        const phoneRes = $http.send({
          url:
            'https://graph.facebook.com/v21.0/' +
            phoneNumberId +
            '?fields=display_phone_number,verified_name,code_verification_status,quality_rating',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + token,
          },
          timeout: 15,
        })

        if (phoneRes.statusCode >= 200 && phoneRes.statusCode < 300) {
          phoneInfo = phoneRes.json
          if (phoneInfo.display_phone_number) {
            settingRecord.set('display_phone_number', phoneInfo.display_phone_number)
          }
          if (phoneInfo.verified_name) {
            settingRecord.set('verified_name', phoneInfo.verified_name)
          }
          if (phoneInfo.quality_rating) {
            settingRecord.set('quality_rating', phoneInfo.quality_rating)
          }
        } else {
          $app
            .logger()
            .warn(
              'Aviso ao buscar Phone Number ID: ' +
                (phoneRes.json?.error?.message || phoneRes.statusCode),
            )
        }
      } catch (phoneErr) {
        $app.logger().warn('Erro ao consultar Phone Number ID: ' + String(phoneErr))
      }
    }

    settingRecord.set('status', 'conectado')
    settingRecord.set('last_tested_at', new Date().toISOString())
    settingRecord.set('last_error', '')

    try {
      $app.save(settingRecord)
    } catch (_) {}

    return e.json(200, {
      success: true,
      status: 'conectado',
      message: 'Token válido e conexão com Meta Cloud API estabelecida!',
      me: meResult,
      phone_info: phoneInfo,
      display_phone_number: settingRecord.getString('display_phone_number'),
      verified_name: settingRecord.getString('verified_name'),
      quality_rating: settingRecord.getString('quality_rating'),
      last_tested_at: settingRecord.getString('last_tested_at'),
    })
  },
  $apis.requireAuth(),
)
