onRecordAfterUpdateSuccess((e) => {
  const titleChanged = e.record.getString('title') !== e.record.original().getString('title')
  const contentChanged = e.record.getString('content') !== e.record.original().getString('content')
  if (!titleChanged && !contentChanged) return e.next()

  const text = (e.record.getString('title') + '\n\n' + e.record.getString('content')).trim()
  if (!text) return e.next()
  try {
    const res = $ai.embed({ input: text })
    const record = $app.findRecordById('care_instructions', e.record.id)
    record.set('embedding', res.data[0].embedding)
    $app.save(record)
  } catch (err) {
    $app.logger().error('Erro ao atualizar embedding de instrução', 'error', String(err))
  }
  return e.next()
}, 'care_instructions')
