routerAdd(
  'POST',
  '/backend/v1/instructions/search',
  (e) => {
    const body = e.requestInfo().body || {}
    const query = (body.query || '').trim()
    if (!query) {
      return e.badRequestError('A consulta é obrigatória')
    }

    try {
      const embedRes = $ai.embed({ input: query })
      const results = $vectors.search(e, 'care_instructions', {
        field: 'embedding',
        query: embedRes.data[0].embedding,
        k: body.k || 10,
      })
      return e.json(200, results)
    } catch (err) {
      $app.logger().error('Erro na busca semântica de orientações', 'error', String(err))
      return e.json(500, { error: 'Falha ao realizar busca semântica.' })
    }
  },
  $apis.requireAuth(),
)
