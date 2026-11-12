const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { ErroApi } = require('../utils/erros');
const { validarCadastro } = require('../validators/authValidator');

const contatoJaCadastrado = () =>
  new ErroApi(400, 'Contato já cadastrado.', { contato: 'Este telefone ou e-mail já tem uma conta.' });

async function cadastrar(body) {
  const { nome, contato, senha, tipo, comunidadeId } = validarCadastro(body);

  if (comunidadeId !== null) {
    const comunidade = await prisma.comunidade.findUnique({ where: { id: comunidadeId } });
    if (!comunidade) {
      throw new ErroApi(400, 'Comunidade não encontrada.', { comunidadeId: 'Comunidade não encontrada.' });
    }
  }

  const contatoExistente = await Promise.all([
    prisma.agricultora.findUnique({ where: { contato } }),
    prisma.coordenadora.findUnique({ where: { contato } })
  ]);

  if (contatoExistente.some(Boolean)) {
    throw contatoJaCadastrado();
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const dados = { nome, contato, senhaHash, comunidadeId };
  let usuario;

  try {
    usuario = tipo === 'AGRICULTORA'
      ? await prisma.agricultora.create({ data: dados })
      : await prisma.coordenadora.create({ data: dados });
  } catch (error) {
    // Duas pessoas cadastrando o mesmo contato ao mesmo tempo: o @unique do banco barra a segunda
    if (error.code === 'P2002') throw contatoJaCadastrado();
    throw error;
  }

  return { id: usuario.id, nome: usuario.nome, contato: usuario.contato, tipo };
}

async function login(body = {}) {
  const contato = typeof body.contato === 'string' ? body.contato.trim() : '';
  const { senha } = body;
  if (!contato || typeof senha !== 'string' || !senha) {
    throw new ErroApi(401, 'contato e senha são obrigatórios.');
  }

  const agricultora = await prisma.agricultora.findUnique({ where: { contato } });
  const coordenadora = agricultora
    ? null
    : await prisma.coordenadora.findUnique({ where: { contato } });
  const usuario = agricultora || coordenadora;
  const tipo = agricultora ? 'AGRICULTORA' : 'COORDENADORA';

  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new ErroApi(401, 'Contato ou senha inválidos.');
  }

  const token = jwt.sign(
    { id: usuario.id, tipo, contato: usuario.contato },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      contato: usuario.contato,
      tipo,
      // true = entrou com senha provisória: o front leva direto para a tela de criar senha nova
      trocarSenha: Boolean(usuario.senhaProvisoria),
    },
  };
}

module.exports = { cadastrar, login };
