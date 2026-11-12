// Confere a configuração de e-mail do .env e manda um e-mail de teste.
// Uso:  npm run email:teste                  (manda para o próprio SMTP_USER)
//       npm run email:teste -- outro@email.com
require('dotenv').config({ quiet: true });
const { enviarEmail, verificarConexao } = require('../src/services/emailService');

const para = process.argv[2] || process.env.SMTP_USER;

(async () => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Preencha SMTP_USER e SMTP_PASS no .env.');
    }
    await verificarConexao();
    console.log(`Conexão com ${process.env.SMTP_HOST} OK.`);
    await enviarEmail({
      para,
      assunto: 'SemeAR: teste de envio de e-mail',
      texto: 'Se você recebeu esta mensagem, o envio de e-mails do SemeAR está funcionando.',
      html: '<p>Se você recebeu esta mensagem, o envio de e-mails do <b>SemeAR</b> está funcionando.</p>',
    });
    console.log(`E-mail de teste enviado para ${para}. Confira a caixa de entrada (e o spam).`);
  } catch (erro) {
    const semPermissao = /535|Username and Password not accepted|Invalid login/i.test(erro.message);
    console.error('Falhou:', erro.message);
    if (semPermissao) {
      console.error('Dica: use uma SENHA DE APP do Google (16 letras), não a senha normal do Gmail.');
    }
    process.exitCode = 1;
  }
})();
