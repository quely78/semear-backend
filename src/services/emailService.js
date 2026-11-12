const nodemailer = require('nodemailer');

// Configuração pelo .env (veja o README). O e-mail sai pelo primeiro que estiver configurado:
//   1. BREVO_API_KEY ... API do Brevo por HTTPS (funciona em hospedagens que bloqueiam SMTP, como o Render gratuito)
//   2. SMTP_HOST ....... servidor SMTP (ex.: Gmail com senha de app)
//   3. nenhum .......... o e-mail não é enviado: o conteúdo aparece no terminal (desenvolvimento)
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_REMETENTE, BREVO_API_KEY } = process.env;
const URL_BREVO = 'https://api.brevo.com/v3';

/** Qual meio de envio está em uso: 'brevo', 'smtp' ou 'terminal'. */
function meioDeEnvio() {
  if (BREVO_API_KEY) return 'brevo';
  if (SMTP_HOST) return 'smtp';
  return 'terminal';
}

const transporte = !BREVO_API_KEY && SMTP_HOST
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

/** "SemeAR <a@b.com>" → { name: 'SemeAR', email: 'a@b.com' } (formato que o Brevo pede). */
function separarRemetente(texto) {
  const partes = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(texto);
  return partes ? { name: partes[1] || 'SemeAR', email: partes[2] } : { name: 'SemeAR', email: texto.trim() };
}

/** Chamada à API do Brevo. Lança um erro com a mensagem dele quando algo dá errado. */
async function chamarBrevo(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BREVO}${caminho}`, {
    ...opcoes,
    headers: { 'api-key': BREVO_API_KEY, accept: 'application/json', 'content-type': 'application/json' },
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(`Brevo respondeu ${resposta.status}: ${corpo.message || corpo.code || 'erro desconhecido'}`);
  }
  return corpo;
}

/** Envia um e-mail pelo meio configurado (ou mostra no terminal). */
async function enviarEmail({ para, assunto, texto, html }) {
  const meio = meioDeEnvio();

  if (meio === 'brevo') {
    await chamarBrevo('/smtp/email', {
      method: 'POST',
      body: JSON.stringify({
        sender: separarRemetente(remetente),
        to: [{ email: para }],
        subject: assunto,
        textContent: texto,
        htmlContent: html || `<p>${escaparHtml(texto)}</p>`,
      }),
    });
    return;
  }

  if (meio === 'smtp') {
    await transporte.sendMail({ from: remetente, to: para, subject: assunto, text: texto, html });
    return;
  }

  console.log(
    `\n[e-mail NÃO enviado: configure BREVO_API_KEY ou SMTP_HOST no .env]\nPara: ${para}\nAssunto: ${assunto}\n\n${texto}\n`,
  );
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

/** Confere se o meio de envio aceita a chave/senha (usado por `npm run email:teste`). */
async function verificarConexao() {
  const meio = meioDeEnvio();
  if (meio === 'brevo') {
    // A chave pode ter acesso restrito (só "E-mails transacionais"), sem permissão para
    // ler dados da conta. Por isso ela é conferida de verdade no envio do e-mail de teste.
    return 'Brevo (a chave é conferida no envio do e-mail de teste)';
  }
  if (meio === 'smtp') {
    await transporte.verify();
    return `SMTP ${SMTP_HOST}`;
  }
  throw new Error('Nenhum envio configurado: preencha BREVO_API_KEY ou SMTP_HOST no .env.');
}

module.exports = { enviarEmail, enviarLinkDeRedefinicao, verificarConexao, meioDeEnvio };
