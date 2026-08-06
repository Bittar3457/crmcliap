migrate(
  (app) => {
    const patients = new Collection({
      name: 'patients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'full_name', type: 'text', required: true },
        { name: 'birth_date', type: 'date' },
        { name: 'parent_name', type: 'text' },
        { name: 'phone', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'text' },
        {
          name: 'blood_type',
          type: 'select',
          values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Desconhecido'],
          maxSelect: 1,
        },
        { name: 'medical_notes', type: 'text' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_patients_phone ON patients (phone)',
        'CREATE INDEX idx_patients_name ON patients (full_name)',
      ],
    })
    app.save(patients)

    const patientsColId = patients.id

    const appointments = new Collection({
      name: 'appointments',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patientsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['consulta', 'vacinacao', 'retorno', 'telemedicina'],
          maxSelect: 1,
        },
        { name: 'date_time', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['agendado', 'confirmado', 'concluido', 'cancelado', 'nao_compareceu'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'reminder_generated', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_appointments_date ON appointments (date_time)',
        'CREATE INDEX idx_appointments_patient ON appointments (patient)',
        'CREATE INDEX idx_appointments_status ON appointments (status)',
      ],
    })
    app.save(appointments)

    const vaccinations = new Collection({
      name: 'vaccinations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patientsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'vaccine_name', type: 'text', required: true },
        { name: 'dose', type: 'text' },
        { name: 'scheduled_date', type: 'date' },
        { name: 'administered_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'aplicada', 'atrasada'],
          maxSelect: 1,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_vaccinations_patient ON vaccinations (patient)',
        'CREATE INDEX idx_vaccinations_status ON vaccinations (status)',
      ],
    })
    app.save(vaccinations)

    const careInstructions = new Collection({
      name: 'care_instructions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          required: true,
          values: ['pos_vacina', 'geral', 'medicamento', 'nutricao', 'acompanhamento'],
          maxSelect: 1,
        },
        { name: 'content', type: 'text', required: true },
        { name: 'is_template', type: 'bool' },
        { name: 'embedding', type: 'vector', dimensions: 1536, distance: 'cosine' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_instructions_category ON care_instructions (category)'],
    })
    app.save(careInstructions)

    const instructionsColId = careInstructions.id

    const whatsappMessages = new Collection({
      name: 'whatsapp_messages',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'patient',
          type: 'relation',
          required: true,
          collectionId: patientsColId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'direction', type: 'select', values: ['enviada', 'recebida'], maxSelect: 1 },
        { name: 'template', type: 'relation', collectionId: instructionsColId, maxSelect: 1 },
        { name: 'content', type: 'text', required: true },
        { name: 'scheduled_for', type: 'date' },
        { name: 'sent_at', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['rascunho', 'agendada', 'enviada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_wa_messages_patient ON whatsapp_messages (patient)',
        'CREATE INDEX idx_wa_messages_status ON whatsapp_messages (status)',
      ],
    })
    app.save(whatsappMessages)
  },
  (app) => {
    const names = [
      'whatsapp_messages',
      'care_instructions',
      'vaccinations',
      'appointments',
      'patients',
    ]
    for (const name of names) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
