const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');
const { validarPerfil } = require('../validators/authValidator');

// Só estes campos saem da API: nunca a senha (nem o hash) ou dados internos
const CAMPOS_DO_PERFIL = {
  id: true,
  nome: true,
  contato: true,
  createdAt: true,
  comunidade: { select: { id: true, nome: true } },
};

const tabelaDo = (usuario) =>
  usuario.tipo === 'AGRICULTORA' ? prisma.agricultora : prisma.coordenadora;

/** Formato de resposta do perfil (igual no GET e no PUT). */
function formatarPerfil(registro, tipo) {
  return {
    id: registro.id,
    nome: registro.nome,
    contato: registro.contato,
    tipo,
    comunidade: registro.comunidade || null,
    criadoEm: registro.createdAt,
  };
}

/** Perfil da usuária logada (o id vem do token, nunca da requisição). */
async function obterPerfil(usuario) {
  const registro = await tabelaDo(usuario).findUnique({
    where: { id: usuario.id },
    select: CAMPOS_DO_PERFIL,
  });
  // Token válido de uma conta que não existe mais (ex.: apagada)
  if (!registro) throw new ErroApi(401, 'Sessão inválida. Entre de novo.');
  return formatarPerfil(registro, usuario.tipo);
}

const contatoEmUso = () =>
  new ErroApi(400, 'Este telefone ou e-mail já é usado por outra conta.', {
    contato: 'Este telefone ou e-mail já é usado por outra conta.',
  });

/**
 * Atualiza nome e contato da usuária logada.
 * O contato continua único entre agricultoras e responsáveis (é o login).
 * Tipo, comunidade e senha NÃO mudam por aqui (a senha tem rota própria).
 */
async function atualizarPerfil(usuario, body) {
  const { nome, contato } = validarPerfil(body);
  const ehAgricultora = usuario.tipo === 'AGRICULTORA';

  const [agricultora, coordenadora] = await Promise.all([
    prisma.agricultora.findUnique({ where: { contato }, select: { id: true } }),
    prisma.coordenadora.findUnique({ where: { contato }, select: { id: true } }),
  ]);
  const usadoPorOutra =
    (agricultora && !(ehAgricultora && agricultora.id === usuario.id)) ||
    (coordenadora && !(!ehAgricultora && coordenadora.id === usuario.id));
  if (usadoPorOutra) throw contatoEmUso();

  try {
    const registro = await tabelaDo(usuario).update({
      where: { id: usuario.id },
      data: { nome, contato },
      select: CAMPOS_DO_PERFIL,
    });
    return formatarPerfil(registro, usuario.tipo);
  } catch (error) {
    if (error.code === 'P2025') throw new ErroApi(401, 'Sessão inválida. Entre de novo.');
    if (error.code === 'P2002') throw contatoEmUso(); // duas pessoas pegando o mesmo contato ao mesmo tempo
    throw error;
  }
}

module.exports = { obterPerfil, atualizarPerfil };
