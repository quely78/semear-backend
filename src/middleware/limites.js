const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Limites de tentativas contra quem tenta adivinhar senhas ou abusar das rotas públicas.
// Contados na memória da API: zeram quando ela reinicia (suficiente para um servidor só).
// Em testes automatizados, LIMITES_DESLIGADOS=1 desliga todos.

const QUINZE_MINUTOS = 15 * 60 * 1000;
const UMA_HORA = 60 * 60 * 1000;

/** Cria um limite que responde 429 no formato de erro da API. */
function limite({ janela, maximo, mensagem, chave, ignorarSucesso = false }) {
  return rateLimit({
    windowMs: janela,
    limit: maximo,
    standardHeaders: 'draft-8', // cabeçalho RateLimit (o cliente sabe quando tentar de novo)
    legacyHeaders: false,
    skipSuccessfulRequests: ignorarSucesso,
    skip: () => process.env.LIMITES_DESLIGADOS === '1',
    keyGenerator: chave,
    handler: (req, res) => res.status(429).json({ message: mensagem }),
  });
}

const porIp = (req) => ipKeyGenerator(req.ip);

/** Contato normalizado do corpo (para o limite valer por conta, não só por aparelho). */
const contatoDoCorpo = (req) =>
  typeof req.body?.contato === 'string' ? req.body.contato.trim().toLowerCase() : '';

/**
 * Login, por conta + aparelho: 5 senhas ERRADAS seguidas bloqueiam por 15 minutos.
 * Logins certos não contam.
 */
const loginPorConta = limite({
  janela: QUINZE_MINUTOS,
  maximo: 5,
  ignorarSucesso: true,
  chave: (req) => `${porIp(req)}|${contatoDoCorpo(req)}`,
  mensagem: 'Muitas tentativas de entrar com senha errada. Espere 15 minutos e tente de novo.',
});

/** Login, por aparelho: barra quem testa muitas contas diferentes a partir do mesmo lugar. */
const loginPorIp = limite({
  janela: QUINZE_MINUTOS,
  maximo: 30,
  ignorarSucesso: true,
  chave: porIp,
  mensagem: 'Muitas tentativas de login a partir desta conexão. Espere 15 minutos e tente de novo.',
});

/** Cadastro: no máximo 10 contas novas por hora a partir do mesmo aparelho. */
const cadastro = limite({
  janela: UMA_HORA,
  maximo: 10,
  chave: porIp,
  mensagem: 'Muitos cadastros a partir desta conexão. Tente de novo mais tarde.',
});

/** Rotas de recuperação de senha (pedir link, validar, redefinir): 10 por 15 minutos. */
const recuperacaoDeSenha = limite({
  janela: QUINZE_MINUTOS,
  maximo: 10,
  chave: porIp,
  mensagem: 'Muitos pedidos de recuperação de senha. Espere 15 minutos e tente de novo.',
});

module.exports = { loginPorConta, loginPorIp, cadastro, recuperacaoDeSenha };
