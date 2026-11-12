const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');
const { validarTrocaDeSenha, erroDaSenha, ehEmail } = require('../validators/authValidator');
const { comunidadeDaUsuaria } = require('./comunidadeService');
const { enviarLinkDeRedefinicao } = require('./emailService');

// Sem letras e números que se confundem (l, 1, o, 0, i): a senha é passada de boca ou por WhatsApp
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Senha provisória aleatória no formato "abcd-2345" (fácil de ler e de digitar no celular). */
function gerarSenhaProvisoria() {
  const letra = () => ALFABETO[crypto.randomInt(ALFABETO.length)];
  const bloco = () => Array.from({ length: 4 }, letra).join('');
  return `${bloco()}-${bloco()}`;
}

/**
 * A responsável gera uma senha provisória para uma agricultora DA COMUNIDADE DELA.
 * A senha anterior deixa de funcionar e, no próximo login, a agricultora cria uma nova.
 * @returns {{ senhaProvisoria: string, agricultora: { id, nome } }}
 */
async function redefinirSenhaDaAgricultora(responsavel, agricultoraId) {
  const id = Number(agricultoraId);
  const comunidade = await comunidadeDaUsuaria(responsavel);

  // Agricultora de outra comunidade responde igual a uma que não existe (não revela quem existe)
  const agricultora = Number.isInteger(id)
    ? await prisma.agricultora.findFirst({ where: { id, comunidadeId: comunidade.id } })
    : null;
  if (!agricultora) throw new ErroApi(404, 'Agricultora não encontrada na sua comunidade.');

  const senhaProvisoria = gerarSenhaProvisoria();
  await prisma.agricultora.update({
    where: { id: agricultora.id },
    data: { senhaHash: await bcrypt.hash(senhaProvisoria, 10), senhaProvisoria: true },
  });

  return { senhaProvisoria, agricultora: { id: agricultora.id, nome: agricultora.nome } };
}

/** Qualquer usuária logada troca a própria senha, informando a atual. */
async function trocarSenha(usuario, body) {
  const { senhaAtual, novaSenha } = validarTrocaDeSenha(body);
  const ehAgricultora = usuario.tipo === 'AGRICULTORA';
  const tabela = ehAgricultora ? prisma.agricultora : prisma.coordenadora;

  const registro = await tabela.findUnique({ where: { id: usuario.id } });
  if (!registro) throw new ErroApi(401, 'Sessão inválida. Entre de novo.');

  if (!(await bcrypt.compare(senhaAtual, registro.senhaHash))) {
    throw new ErroApi(400, 'A senha atual está incorreta.', { senhaAtual: 'A senha atual está incorreta.' });
  }

  const data = { senhaHash: await bcrypt.hash(novaSenha, 10) };
  if (ehAgricultora) data.senhaProvisoria = false;
  await tabela.update({ where: { id: registro.id }, data });
}

// ---------------------------------------------------------------
// Esqueci minha senha — por e-mail
// ---------------------------------------------------------------
const VALIDADE_MINUTOS = 30;
const INTERVALO_MINIMO_MS = 60 * 1000; // no máximo um e-mail por minuto para a mesma conta
const FRONT_URL = (process.env.FRONT_URL || 'http://localhost:5173').replace(/\/$/, '');

const hashDoToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** Procura a conta pelo e-mail nas duas tabelas (sem diferenciar maiúsculas). */
async function contaPorEmail(email) {
  const filtro = { where: { contato: { equals: email, mode: 'insensitive' } } };
  const agricultora = await prisma.agricultora.findFirst(filtro);
  if (agricultora) return { tipo: 'AGRICULTORA', usuario: agricultora };
  const coordenadora = await prisma.coordenadora.findFirst(filtro);
  return coordenadora ? { tipo: 'COORDENADORA', usuario: coordenadora } : null;
}

/**
 * Pede o link por e-mail. Responde igual exista a conta ou não,
 * para ninguém usar esta rota para descobrir quais e-mails estão cadastrados.
 */
async function solicitarRedefinicao(body = {}) {
  const contato = typeof body.contato === 'string' ? body.contato.trim() : '';
  if (!contato) {
    throw new ErroApi(400, 'Informe o e-mail da sua conta.', { contato: 'Informe o e-mail da sua conta.' });
  }
  if (!ehEmail(contato)) {
    const msg = 'A recuperação por e-mail só funciona para contas criadas com e-mail. Se você usa telefone, peça uma senha provisória para a responsável pela sua comunidade.';
    throw new ErroApi(400, msg, { contato: msg });
  }

  const conta = await contaPorEmail(contato);
  if (!conta) return;

  const ultimo = await prisma.redefinicaoSenha.findFirst({
    where: { tipo: conta.tipo, usuarioId: conta.usuario.id },
    orderBy: { createdAt: 'desc' },
  });
  if (ultimo && Date.now() - ultimo.createdAt.getTime() < INTERVALO_MINIMO_MS) return;

  // Um link novo cancela os anteriores que não foram usados
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.redefinicaoSenha.deleteMany({ where: { tipo: conta.tipo, usuarioId: conta.usuario.id, usadoEm: null } }),
    prisma.redefinicaoSenha.create({
      data: {
        tokenHash: hashDoToken(token),
        tipo: conta.tipo,
        usuarioId: conta.usuario.id,
        expiraEm: new Date(Date.now() + VALIDADE_MINUTOS * 60 * 1000),
      },
    }),
  ]);

  await enviarLinkDeRedefinicao({
    para: conta.usuario.contato,
    nome: conta.usuario.nome,
    link: `${FRONT_URL}/redefinir-senha?token=${token}`,
    minutos: VALIDADE_MINUTOS,
  });
}

const linkInvalido = () =>
  new ErroApi(400, 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".');

/** Busca o pedido válido (não usado e dentro do prazo) pelo token do link. */
async function pedidoValido(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw linkInvalido();
  const pedido = await prisma.redefinicaoSenha.findUnique({ where: { tokenHash: hashDoToken(token) } });
  if (!pedido || pedido.usadoEm || pedido.expiraEm < new Date()) throw linkInvalido();
  return pedido;
}

/** Confere o link antes de mostrar o formulário (a tela avisa logo se ele expirou). */
async function validarLink(body = {}) {
  await pedidoValido(body.token);
}

/** Cria a senha nova a partir do link do e-mail. */
async function redefinirComLink(body = {}) {
  const erroNova = erroDaSenha(body.novaSenha);
  if (erroNova) throw new ErroApi(400, erroNova, { novaSenha: erroNova });

  const pedido = await pedidoValido(body.token);
  const ehAgricultora = pedido.tipo === 'AGRICULTORA';
  const tabela = ehAgricultora ? prisma.agricultora : prisma.coordenadora;
  const data = { senhaHash: await bcrypt.hash(body.novaSenha, 10) };
  if (ehAgricultora) data.senhaProvisoria = false;

  await prisma.$transaction([
    tabela.update({ where: { id: pedido.usuarioId }, data }),
    prisma.redefinicaoSenha.update({ where: { id: pedido.id }, data: { usadoEm: new Date() } }),
    // Outros links pendentes da mesma conta deixam de valer
    prisma.redefinicaoSenha.deleteMany({
      where: { tipo: pedido.tipo, usuarioId: pedido.usuarioId, usadoEm: null, id: { not: pedido.id } },
    }),
  ]);
}

module.exports = {
  redefinirSenhaDaAgricultora,
  trocarSenha,
  gerarSenhaProvisoria,
  solicitarRedefinicao,
  validarLink,
  redefinirComLink,
};
