// Confere a configuração de e-mail do .env e manda um e-mail de teste.
// Uso:  npm run email:teste                  (manda para o próprio remetente)
//       npm run email:teste -- outro@email.com
require('dotenv').config({ quiet: true });
const { enviarEmail, verificarConexao, meioDeEnvio } = require('../src/services/emailService');

const remetente = process.env.EMAIL_REMETENTE || process.env.SMTP_USER || '';
const emailDoRemetente = (/<([^>]+)>/.exec(remetente) || [])[1] || remetente.trim();
const para = process.argv[2] || emailDoRemetente;

(async () => {
  try {
    const meio = meioDeEnvio();
    if (meio === 'smtp' && (!process.env.SMTP_USER || !process.env.SMTP_PASS)) {
      throw new Error('Preencha SMTP_USER e SMTP_PASS no .env.');
    }
    if (meio === 'brevo' && !emailDoRemetente) {
      throw new Error('Preencha EMAIL_REMETENTE no .env com o e-mail confirmado no Brevo.');
    }
    if (!para) throw new Error('Diga para quem mandar: npm run email:teste -- seu@email.com');

    console.log(`Conexão OK: ${await verificarConexao()}.`);
    await enviarEmail({
      para,
      assunto: 'SemeAR: teste de envio de e-mail',
      texto: 'Se você recebeu esta mensagem, o envio de e-mails do SemeAR está funcionando.',
      html: '<p>Se você recebeu esta mensagem, o envio de e-mails do <b>SemeAR</b> está funcionando.</p>',
    });
    console.log(`E-mail de teste enviado para ${para}. Confira a caixa de entrada (e o spam).`);
  } catch (erro) {
    console.error('Falhou:', erro.message);
    if (/535|Username and Password not accepted|Invalid login/i.test(erro.message)) {
      console.error('Dica: use uma SENHA DE APP do Google (16 letras), não a senha normal do Gmail.');
    }
    if (/Brevo respondeu 401/.test(erro.message)) {
      console.error('Dica: a BREVO_API_KEY está errada. Copie de novo em Brevo → SMTP & API → API Keys.');
    }
    if (/sender|remetente|not valid/i.test(erro.message)) {
      console.error('Dica: o EMAIL_REMETENTE precisa estar confirmado no Brevo (Senders, Domains & Dedicated IPs → Senders).');
    }
    process.exitCode = 1;
  }
})();
