onMailerRecordPasswordResetSend((e) => {
  const token = (e.meta && e.meta.token) || ''
  const siteUrl = $os.getenv('SITE_URL') || ''
  const name = (e.record && e.record.getString('name')) || 'Usuário'

  if (siteUrl && token) {
    const cleanUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
    const resetUrl = cleanUrl + '/redefinir-senha?token=' + encodeURIComponent(token)

    e.message.subject = 'Redefinição de senha — Cliap Pediatria e Imunização'
    e.message.html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1e293b; line-height: 1.6;">
        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #1F3A4D; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
            Cliap • Pediatria e Imunização
          </h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">
            CRM e Central de Atendimento Pediátrico
          </p>
        </div>

        <p style="margin-top: 0; font-size: 15px;">Olá, <strong>${name}</strong>,</p>
        
        <p style="font-size: 14px; color: #334155;">
          Recebemos uma solicitação para redefinir a senha de acesso da sua conta na plataforma <strong>Cliap</strong>.
        </p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #1F3A4D; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
          Se o botão acima não funcionar, copie e cole o link abaixo em seu navegador:
          <br />
          <a href="${resetUrl}" style="color: #1F3A4D; word-break: break-all; font-size: 12px;">${resetUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />

        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 4px;">
          Se você não solicitou a redefinição de senha, desconsidere este e-mail com segurança. Seu acesso continuará inalterado.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          © Cliap Pediatria e Imunização • Equipe de Tecnologia
        </p>
      </div>
    `
  }

  e.next()
})
