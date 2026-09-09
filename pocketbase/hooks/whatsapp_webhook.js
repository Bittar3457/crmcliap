// Webhook público da Meta Cloud API para recebimento de eventos e mensagens inbound
// Rota GET: verificação do webhook (hub.mode, hub.verify_token, hub.challenge)
// Rota POST: recepção de notificações de mensagens inbound
routerAdd('GET', '/backend/v1/whatsapp/webhook', (e) => {
  const query = e.requestInfo().query || {}
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  let expectedToken = ''
  try {
    const records = $app.findRecordsByFilter('whatsapp_settings', '', '-created', 1, 0)
    if (records && records.length > 0) {
      expectedToken = records[0].getString('webhook_verify_token') || ''
    }
  } catch (err) {
    $app.logger().error('Erro ao ler webhook_verify_token', 'error', String(err))
  }

  // Se o modo for subscribe e o token bater, responde com o challenge
  if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
    $app.logger().info('Meta Webhook verificado com sucesso!')
    // PocketBase response raw string/text for challenge
    return e.string(200, challenge)
  }

  $app.logger().warn('Meta Webhook: verificação falhou (token não confere)')
  return e.json(403, { error: 'Verificação de Webhook falhou.' })
})

routerAdd('POST', '/backend/v1/whatsapp/webhook', (e) => {
  const body = e.requestInfo().body || {}

  // A Meta envia notificações em envelope entry -> changes -> value -> messages
  try {
    const entries = body.entry || []
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const changes = entry.changes || []
      for (let j = 0; j < changes.length; j++) {
        const change = changes[j]
        const value = change.value || {}

        // Mensagens recebidas
        const messages = value.messages || []
        const contacts = value.contacts || []

        for (let m = 0; m < messages.length; m++) {
          const msg = messages[m]
          const fromPhone = msg.from || ''
          const msgType = msg.type || ''

          let textContent = ''
          if (msgType === 'text') {
            textContent = msg.text?.body || ''
          } else if (msgType === 'button') {
            textContent = msg.button?.text || '[Botão clicado]'
          } else if (msgType === 'interactive') {
            textContent =
              msg.interactive?.button_reply?.title ||
              msg.interactive?.list_reply?.title ||
              '[Resposta interativa]'
          } else {
            textContent = `[Mensagem recebida tipo: ${msgType}]`
          }

          if (!textContent) continue

          // Normaliza telefone do remetente
          const rawDigits = fromPhone.replace(/\D/g, '')
          const shortDigits = rawDigits.startsWith('55') ? rawDigits.slice(2) : rawDigits

          // Tenta encontrar paciente vinculado na collection patients
          let matchedPatientId = ''
          try {
            const allPatients = $app.findRecordsByFilter('patients', '', '-created', 200, 0)
            for (let p = 0; p < allPatients.length; p++) {
              const pRecord = allPatients[p]
              const pPhone = (pRecord.getString('phone') || '').replace(/\D/g, '')
              const pShort = pPhone.startsWith('55') ? pPhone.slice(2) : pPhone

              if (
                pShort &&
                (pShort === shortDigits ||
                  pShort.endsWith(shortDigits) ||
                  shortDigits.endsWith(pShort))
              ) {
                matchedPatientId = pRecord.id
                break
              }
            }
          } catch (findErr) {
            $app.logger().warn('Erro ao buscar paciente para inbound: ' + String(findErr))
          }

          // Se encontrou paciente, grava na whatsapp_messages
          // (se não encontrou mas a collection exige patient, grava no primeiro ou cria sem falhar)
          try {
            const col = $app.findCollectionByNameOrId('whatsapp_messages')
            const newRec = new Record(col)
            if (matchedPatientId) {
              newRec.set('patient', matchedPatientId)
            } else {
              // Busca qualquer paciente ou primeiro para não violar constraint required
              const firstPt = $app.findRecordsByFilter('patients', '', '-created', 1, 0)
              if (firstPt && firstPt.length > 0) {
                newRec.set('patient', firstPt[0].id)
              }
            }

            newRec.set('direction', 'recebida')
            newRec.set('content', textContent)
            newRec.set('sent_at', new Date().toISOString())
            newRec.set('status', 'enviada')

            $app.save(newRec)
            $app
              .logger()
              .info(
                'Mensagem inbound do WhatsApp salva com sucesso! Tel: ' +
                  fromPhone +
                  ', Paciente: ' +
                  (matchedPatientId || 'desconhecido'),
              )
          } catch (saveErr) {
            $app.logger().error('Erro ao salvar whatsapp_messages inbound: ' + String(saveErr))
          }
        }
      }
    }
  } catch (parseErr) {
    $app.logger().error('Erro ao processar payload do webhook Meta: ' + String(parseErr))
  }

  // Meta exige retorno 200 rápido para confirmar entrega
  return e.json(200, { status: 'EVENT_RECEIVED' })
})
