routerAdd(
  'POST',
  '/backend/v1/whatsapp/draft',
  (e) => {
    const body = e.requestInfo().body || {}
    const patientId = body.patient_id
    const instructionId = body.instruction_id
    const notes = body.notes || ''

    if (!patientId) {
      return e.badRequestError('patient_id é obrigatório')
    }

    let patientName = 'Paciente'
    let parentName = 'Responsável'
    try {
      const patient = $app.findRecordById('patients', patientId)
      patientName = patient.getString('full_name') || patientName
      parentName = patient.getString('parent_name') || parentName
    } catch (_) {}

    let instructionText = ''
    if (instructionId) {
      try {
        const inst = $app.findRecordById('care_instructions', instructionId)
        instructionText = inst.getString('content') || ''
      } catch (_) {}
    }

    const prompt = `Você é um assistente atencioso da Cliap (Pediatria e Imunização).
Redija uma mensagem de WhatsApp para ser enviada ao responsável pelo paciente.

Dados do contexto:
- Nome do responsável: ${parentName}
- Nome do paciente (criança): ${patientName}
- Orientações/Modelo base: ${instructionText || 'Nenhum modelo selecionado'}
- Observações/Anotações adicionais: ${notes || 'Nenhuma'}

Regras de redação:
1. Comece saudando o responsável de forma carinhosa e acolhedora pelo nome (${parentName}).
2. Mencione o paciente (${patientName}).
3. Transmita as orientações de forma clara, humanizada e profissional em nome da Cliap.
4. Finalize com assinatura profissional "Atenciosamente, Equipe Cliap • Pediatria e Imunização".
5. Use emojis adequados e formatação leve com marcadores se necessário.
6. Retorne APENAS o texto da mensagem para o WhatsApp sem aspas ou meta-explicações.`

    try {
      const reply = $ai.chat({
        model: 'fast',
        messages: [
          {
            role: 'system',
            content: 'Você é um redator profissional de comunicação pediátrica médica.',
          },
          { role: 'user', content: prompt },
        ],
      })

      const draftText = reply.choices[0]?.message?.content || ''
      return e.json(200, { draft: draftText.trim() })
    } catch (err) {
      $app.logger().error('Erro ao gerar rascunho com IA', 'error', String(err))
      return e.json(500, { error: 'Falha ao gerar rascunho automatizado.' })
    }
  },
  $apis.requireAuth(),
)
