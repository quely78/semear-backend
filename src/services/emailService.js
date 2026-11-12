const nodemailer = require('nodemailer');

// Configuração pelo .env (veja o README). Sem SMTP_HOST, os e-mails não são enviados:
// o conteúdo aparece no terminal da API, o que basta para testar em desenvolvimento.
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_REMETENTE } = process.env;

const transporte = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465, // 465 = conexão já criptografada; 587 = STARTTLS
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

// Sem EMAIL_REMETENTE, envia como "SemeAR <conta do SMTP>" (o Gmail só deixa enviar pela própria conta)
const remetente =
  EMAIL_REMETENTE || (SMTP_USER ? `SemeAR <${SMTP_USER}>` : 'SemeAR <nao-responda@semear.local>');

/** Envia um e-mail (ou mostra no terminal quando o SMTP não está configurado). */
async function enviarEmail({ para, assunto, texto, html }) {
  if (!transporte) {
    console.log(
      `\n[e-mail NÃO enviado: configure SMTP_HOST no .env]\nPara: ${para}\nAssunto: ${assunto}\n\n${texto}\n`,
    );
    return;
  }
  await transporte.sendMail({ from: remetente, to: para, subject: assunto, text: texto, html });
}

/** Evita que um nome com "<" ou "&" vire HTML dentro do e-mail. */
function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** E-mail com o link para criar uma senha nova. */
function enviarLinkDeRedefinicao({ para, nome, link, minutos }) {
  const primeiroNomeTexto = (nome || '').trim().split(/\s+/)[0] || 'Olá';
  const primeiroNome = escaparHtml(primeiroNomeTexto);
  const texto = [
    `${primeiroNomeTexto}, recebemos um pedido para criar uma senha nova no SemeAR.`,
    '',
    `Abra este link para criar a senha nova (vale por ${minutos} minutos e só funciona uma vez):`,
    link,
    '',
    'Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.',
  ].join('\n');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#22301f">
    <h1 style="font-size:22px;color:#355e3b;margin:0 0 12px">Seme<span style="color:#be3e73">AR</span></h1>
    <p>${primeiroNome}, recebemos um pedido para criar uma senha nova no SemeAR.</p>
    <p style="margin:24px 0">
      <a href="${link}" style="background:#355e3b;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">
        Criar senha nova
      </a>
    </p>
    <p style="font-size:14px;color:#5d6657">O link vale por ${minutos} minutos e só funciona uma vez.</p>
    <p style="font-size:14px;color:#5d6657">Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.</p>
  </div>`;

  return enviarEmail({ para, assunto: 'SemeAR: criar uma senha nova', texto, html });
}

/** Confere se o servidor de e-mail aceita a conexão e a senha (usado por `npm run email:teste`). */
async function verificarConexao() {
  if (!transporte) throw new Error('SMTP_HOST não está configurado no .env.');
  await transporte.verify();
}

module.exports = { enviarEmail, enviarLinkDeRedefinicao, verificarConexao };
