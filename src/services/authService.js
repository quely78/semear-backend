const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

async function cadastrar({ nome, contato, senha, tipo, comunidadeId }) {
  if (!nome || !contato || !senha || !tipo) {
    throw new Error('nome, contato, senha e tipo são obrigatórios.');
  }

  if (!['AGRICULTORA', 'COORDENADORA'].includes(tipo)) {
    throw new Error('tipo deve ser AGRICULTORA ou COORDENADORA.');
  }

  if (tipo === 'AGRICULTORA' && !comunidadeId) {
    throw new Error('comunidadeId é obrigatório para agricultora.');
  }

  const contatoExistente = await Promise.all([
    prisma.agricultora.findUnique({ where: { contato } }),
    prisma.coordenadora.findUnique({ where: { contato } })
  ]);

  if (contatoExistente.some(Boolean)) {
    throw new Error('Contato já cadastrado.');
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const dados = { nome, contato, senhaHash };
  let usuario;

  if (tipo === 'AGRICULTORA') {
    usuario = await prisma.agricultora.create({
      data: { ...dados, comunidadeId: Number(comunidadeId) }
    });
  } else {
    usuario = await prisma.coordenadora.create({
      data: {
        ...dados,
        comunidadeId: comunidadeId ? Number(comunidadeId) : null
      }
    });
  }

  return { id: usuario.id, nome: usuario.nome, contato: usuario.contato, tipo };
}

async function login({ contato, senha }) {
  if (!contato || !senha) {
    throw new Error('contato e senha são obrigatórios.');
  }

  const agricultora = await prisma.agricultora.findUnique({ where: { contato } });
  const coordenadora = agricultora
    ? null
    : await prisma.coordenadora.findUnique({ where: { contato } });
  const usuario = agricultora || coordenadora;
  const tipo = agricultora ? 'AGRICULTORA' : 'COORDENADORA';

  if (!usuario || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    throw new Error('Contato ou senha inválidos.');
  }

  const token = jwt.sign(
    { id: usuario.id, tipo, contato: usuario.contato },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { token, usuario: { id: usuario.id, nome: usuario.nome, contato: usuario.contato, tipo } };
}

module.exports = { cadastrar, login };
