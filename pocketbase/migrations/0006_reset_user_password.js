migrate(
  (app) => {
    const targetEmail = 'robertobittar98@gmail.com'
    const newPassword = 'Skip@Pass'

    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // Tenta localizar pelo e-mail alvo especificado
    let userRecord
    try {
      userRecord = app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
    } catch (_) {
      // Se não encontrou pelo e-mail exato, busca o primeiro registro existente na coleção de usuários
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', '', '-created', 1, 0)
        if (users && users.length > 0) {
          userRecord = users[0]
        }
      } catch (e) {
        console.log('Nenhum usuário encontrado na busca geral:', e)
      }
    }

    if (userRecord) {
      console.log('Atualizando senha e verificação para o usuário:', targetEmail)
      userRecord.setEmail(targetEmail)
      userRecord.setPassword(newPassword)
      userRecord.setVerified(true)
      app.save(userRecord)
    } else {
      console.log('Criando novo usuário com as credenciais padrão:', targetEmail)
      const record = new Record(usersCol)
      record.setEmail(targetEmail)
      record.setPassword(newPassword)
      record.setVerified(true)
      record.set('name', 'Dr. Roberto Bittar')
      app.save(record)
    }
  },
  (app) => {
    // Reversão não é necessária / no-op para redefinição de senha
  },
)
