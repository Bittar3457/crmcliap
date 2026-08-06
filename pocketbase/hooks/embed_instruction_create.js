onRecordAfterCreateSuccess((e) => {
  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('care_instructions', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    $app.logger().error('Erro ao gerar embedding de instrução', 'error', String(err))
  }
  return e.next()
}, 'care_instructions')
