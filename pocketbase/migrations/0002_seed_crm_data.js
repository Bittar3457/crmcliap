migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'robertobittar98@gmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('robertobittar98@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Dr. Roberto Bittar')
      app.save(record)
      adminUser = record
    }

    const instructionsCol = app.findCollectionByNameOrId('care_instructions')
    const instructionsList = [
      {
        title: 'Orientações pós-vacina',
        category: 'pos_vacina',
        content:
          'Olá! Seguem as orientações pós-vacinação do seu bebê:\n1. Aplique compressa fria no local da aplicação se houver inchaço ou vermelhidão.\n2. Em caso de febre leve (até 38°C), mantenha a criança com roupas leves e bem hidratada.\n3. Se a febre persistir ou ultrapassar 38.5°C, administre o antitérmico recomendado pelo pediatra.\n4. Qualquer sintoma incomum, entre em contato com nossa clínica.',
        is_template: true,
      },
      {
        title: 'Cuidados com febre',
        category: 'geral',
        content:
          'Orientações sobre controle de febre infantil:\n1. A febre é uma resposta de defesa do organismo.\n2. Monitore a temperatura de 3 em 3 horas.\n3. Mantenha o ambiente arejado e ofereça bastante líquidos (água, leite materno ou suco natural).\n4. Procure atendimento imediato se houver prostração intensa, rigidez de nuca ou convulsão febril.',
        is_template: true,
      },
      {
        title: 'Uso de antitérmico',
        category: 'medicamento',
        content:
          'Instruções para uso de medicamentos antitérmicos:\n- A dosagem é estritamente calculada pelo peso corporal da criança informado na última consulta.\n- Respeite rigorosamente o intervalo mínimo de 6 horas entre as doses.\n- Nunca ofereça medicação com o estômago totalmente vazio.',
        is_template: true,
      },
      {
        title: 'Aleitamento e alimentação',
        category: 'nutricao',
        content:
          'Orientações nutricionais pediátricas:\n- Até os 6 meses: Aleitamento materno exclusivo e em livre demanda.\n- A partir dos 6 meses: Introdução alimentar progressiva com papas de frutas e legumes amassados, sem sal ou açúcar adicionado.\n- Mantenha acompanhamento para verificar o ganho de peso e estatura.',
        is_template: true,
      },
      {
        title: 'Acompanhamento de recém-nascido',
        category: 'acompanhamento',
        content:
          'Acompanhamento nos primeiros meses de vida:\n- Consultas mensais recomendadas até o 6º mês.\n- Mantenha a caderneta de vacinação rigorosamente em dia.\n- Observe a pega durante a amamentação e a rotina do sono seguro (sempre de barriga para cima).',
        is_template: true,
      },
    ]

    const savedInstructions = []
    for (const inst of instructionsList) {
      try {
        const existing = app.findFirstRecordByData('care_instructions', 'title', inst.title)
        savedInstructions.push(existing)
      } catch (_) {
        const rec = new Record(instructionsCol)
        rec.set('title', inst.title)
        rec.set('category', inst.category)
        rec.set('content', inst.content)
        rec.set('is_template', inst.is_template)
        app.save(rec)
        savedInstructions.push(rec)
      }
    }

    const patientsCol = app.findCollectionByNameOrId('patients')
    let patientRecord
    try {
      patientRecord = app.findFirstRecordByData('patients', 'full_name', 'Maria Clara Silva')
    } catch (_) {
      const rec = new Record(patientsCol)
      rec.set('full_name', 'Maria Clara Silva')
      rec.set('birth_date', '2022-03-12 00:00:00.000Z')
      rec.set('parent_name', 'Ana Silva')
      rec.set('phone', '+5511999999999')
      rec.set('email', 'ana.silva@exemplo.com')
      rec.set('address', 'Av. Paulista, 1000 - São Paulo, SP')
      rec.set('blood_type', 'O+')
      rec.set('medical_notes', 'Sem alergias conhecidas. Acompanhamento de rotina ok.')
      rec.set('active', true)
      app.save(rec)
      patientRecord = rec
    }

    const appointmentsCol = app.findCollectionByNameOrId('appointments')
    try {
      app.findFirstRecordByData('appointments', 'patient', patientRecord.id)
    } catch (_) {
      const rec = new Record(appointmentsCol)
      rec.set('patient', patientRecord.id)
      rec.set('type', 'consulta')
      rec.set('date_time', '2026-08-15 14:00:00.000Z')
      rec.set('status', 'agendado')
      rec.set('notes', 'Consulta trimestral de puericultura')
      rec.set('reminder_generated', false)
      app.save(rec)
    }

    const vacCol = app.findCollectionByNameOrId('vaccinations')
    try {
      app.findFirstRecordByData('vaccinations', 'vaccine_name', 'Pentavalente')
    } catch (_) {
      const v1 = new Record(vacCol)
      v1.set('patient', patientRecord.id)
      v1.set('vaccine_name', 'Pentavalente')
      v1.set('dose', '1ª dose')
      v1.set('administered_date', '2022-05-12 00:00:00.000Z')
      v1.set('status', 'aplicada')
      v1.set('notes', 'Sem reações adversas reportadas.')
      app.save(v1)

      const v2 = new Record(vacCol)
      v2.set('patient', patientRecord.id)
      v2.set('vaccine_name', 'Febre Amarela')
      v2.set('dose', 'Dose de reforço')
      v2.set('scheduled_date', '2026-08-20 00:00:00.000Z')
      v2.set('status', 'agendada')
      v2.set('notes', 'Aguardando data.')
      app.save(v2)
    }

    const waCol = app.findCollectionByNameOrId('whatsapp_messages')
    try {
      app.findFirstRecordByData('whatsapp_messages', 'patient', patientRecord.id)
    } catch (_) {
      const rec = new Record(waCol)
      rec.set('patient', patientRecord.id)
      rec.set('direction', 'enviada')
      if (savedInstructions.length > 0) {
        rec.set('template', savedInstructions[0].id)
      }
      rec.set(
        'content',
        'Olá Ana! Lembrete da vacinação de Febre Amarela agendada para Maria Clara Silva. Qualquer dúvida estamos à disposição!',
      )
      rec.set('status', 'enviada')
      rec.set('sent_at', '2026-08-01 10:00:00.000Z')
      app.save(rec)
    }
  },
  (app) => {},
)
