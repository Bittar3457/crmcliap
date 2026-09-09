routerAdd(
  'POST',
  '/backend/v1/whatsapp/send',
  (e) => {
    const body = e.requestInfo().body || {}
    const toPhone = String(body.to || body.phone || '').trim()
    const messageText = String(body.content || body.message || '').trim()
    const patientId = body.patient_id || body.patient || ''
    const templateId = body.template_id || body.template || ''

    if (!toPhone) {
      return e.badRequestError('Telefone do destinatário é obrigatório.')
    }
    if (!messageText) {
      return e.badRequestError('Conteúdo da mensagem é obrigatório.')
    }

    // Busca configurações
    let settingRecord = null
    try {
      const records = $app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
      if (records && records.length > 0) {
        settingRecord = records[0]
      }
    } catch (err) {
      $app.logger().error('Erro ao ler whatsapp_settings no envio', 'error', String(err))
    }

    const token = settingRecord ? settingRecord.getString('access_token') : ''
    const phoneNumberId = settingRecord ? settingRecord.getString('phone_number_id') : ''

    if (!settingRecord || !token || !phoneNumberId) {
      return e.json(400, {
        success: false,
        error:
          'Integração WhatsApp não configurada ou incompleta (Phone Number ID ou Token ausente).',
        needs_setup: true,
      })
    }

    // Normaliza número para padrão internacional (E.164 sem +): ex: 5511999998888
    let cleanPhone = toPhone.replace(/\D/g, '')
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = '55' + cleanPhone
    }

    // Dispara via WhatsApp Cloud API: POST /{phone_number_id}/messages
    const apiUrl = 'https://graph.facebook.com/v21.0/' + phoneNumberId + '/messages'
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    }

    let metaRes = null
    try {
      metaRes = $http.send({
        url: apiUrl,
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 20,
      })
    } catch (httpErr) {
      $app.logger().error('Falha de rede ao chamar Meta Cloud API', 'error', String(httpErr))
      return e.json(502, {
        success: false,
        error: 'Erro de comunicação com os servidores da Meta: ' + String(httpErr),
        fallback_available: true,
      })
    }

    const isSuccess = metaRes.statusCode >= 200 && metaRes.statusCode < 300
    const resData = metaRes.json || {}

    if (!isSuccess) {
      // Ex.: conta em análise, sem forma de pagamento, template exigido fora da janela de 24h
      const metaError = resData.error || {}
      const errMsg =
        metaError.message ||
        metaError.error_user_msg ||
        'Falha no envio pela Meta Cloud API (HTTP ' + metaRes.statusCode + ')'
      const errCode = metaError.code || metaRes.statusCode
      const errSubcode = metaError.error_subcode || ''

      // Se o erro for de autorização ou token inválido, atualiza status da integração
      if (metaRes.statusCode === 401 || errCode === 190) {
        try {
          settingRecord.set('status', 'erro')
          settingRecord.set('last_error', errMsg)
          $app.save(settingRecord)
        } catch (_) {}
      }

      $app.logger().warn('WhatsApp Cloud API send failed: code=' + errCode + ', msg=' + errMsg)

      return e.json(400, {
        success: false,
        error: errMsg,
        code: errCode,
        error_subcode: errSubcode,
        details: metaError,
        fallback_available: true,
      })
    }

    // Sucesso no envio real: salva no histórico whatsapp_messages
    let createdMsg = null
    try {
      const col = $app.findCollectionByNameOrId('whatsapp_messages')
      const msgRec = new Record(col)

      // Se temos patientId válido, vincula
      if (patientId) {
        msgRec.set('patient', patientId)
      } else {
        // Tenta achar paciente pelo telefone
        try {
          const rawDigits = toPhone.replace(/\D/g, '')
          const shortDigits = rawDigits.startsWith('55') ? rawDigits.slice(2) : rawDigits
          const pts = $app.findRecordsByFilter('patients', 'phone ~ {:p}', '-created', 1, 0, {
            p: shortDigits.slice(-8),
          })
          if (pts && pts.length > 0) {
            msgRec.set('patient', pts[0].id)
          }
        } catch (_) {}
      }

      if (templateId) {
        msgRec.set('template', templateId)
      }
      msgRec.set('direction', 'enviada')
      msgRec.set('content', messageText)
      msgRec.set('sent_at', new Date().toISOString())
      msgRec.set('status', 'enviada')

      $app.save(msgRec)
      createdMsg = {
        id: msgRec.id,
        patient: msgRec.getString('patient'),
        direction: 'enviada',
        content: messageText,
        sent_at: msgRec.getString('sent_at'),
        status: 'enviada',
      }
    } catch (saveErr) {
      $app
        .logger()
        .error('Erro ao registrar mensagem enviada na collection', 'error', String(saveErr))
    }

    return e.json(200, {
      success: true,
      meta_response: resData,
      whatsapp_message_id: resData.messages?.[0]?.id,
      crm_message: createdMsg,
    })
  },
  $apis.requireAuth(),
)
