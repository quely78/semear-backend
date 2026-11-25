// Apoio dos testes automatizados: cria uma comunidade só para a suíte,
// pessoas de teste e tokens, e apaga tudo no final.
//
// IMPORTANTE: este arquivo precisa ser importado ANTES do app em cada teste.
// Ele desliga o limite de tentativas e o envio de e-mail de verdade
// (sem BREVO_API_KEY e SMTP_HOST, o e-mail só aparece no terminal).
process.env.LIMITES_DESLIGADOS = '1';
process.env.BREVO_API_KEY = '';
process.env.SMTP_HOST = '';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const prisma = require('../src/config/prisma');

const SENHA = 'Teste123!';
const senhaHash = bcrypt.hashSync(SENHA, 4);
const sufixo = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Cria uma comunidade isolada para a suíte (nada se mistura com dados reais). */
async function criarComunidade(nome = 'Comunidade de teste') {
  return prisma.comunidade.create({ data: { nome: `${nome} ${sufixo()}` } });
}

async function criarAgricultora(comunidadeId, dados = {}) {
  return prisma.agricultora.create({
    data: {
      nome: 'Agricultora de teste',
      contato: `agricultora-${sufixo()}@example.com`,
      senhaHash,
      comunidadeId,
      ...dados,
    },
  });
}

async function criarResponsavel(comunidadeId, dados = {}) {
  return prisma.coordenadora.create({
    data: {
      nome: 'Responsável de teste',
      contato: `responsavel-${sufixo()}@example.com`,
      senhaHash,
      comunidadeId,
      ...dados,
    },
  });
}

/** Token igual ao do login (o mesmo formato que a API assina). */
function tokenDe(pessoa, tipo) {
  return jwt.sign({ id: pessoa.id, tipo, contato: pessoa.contato }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/** Apaga tudo o que foi criado na comunidade de teste (plantios, gastos e vendas vão em cascata). */
async function limparComunidade(comunidadeId) {
  const agricultoras = await prisma.agricultora.findMany({ where: { comunidadeId }, select: { id: true } });
  const coordenadoras = await prisma.coordenadora.findMany({ where: { comunidadeId }, select: { id: true } });
  const ids = agricultoras.map((a) => a.id);
  await prisma.redefinicaoSenha.deleteMany({
    where: {
      OR: [
        { tipo: 'AGRICULTORA', usuarioId: { in: ids } },
        { tipo: 'COORDENADORA', usuarioId: { in: coordenadoras.map((c) => c.id) } },
      ],
    },
  });
  await prisma.plantio.deleteMany({ where: { agricultoraId: { in: ids } } });
  await prisma.agricultora.deleteMany({ where: { comunidadeId } });
  await prisma.coordenadora.deleteMany({ where: { comunidadeId } });
  await prisma.comunidade.delete({ where: { id: comunidadeId } });
}

module.exports = {
  prisma,
  SENHA,
  sufixo,
  criarComunidade,
  criarAgricultora,
  criarResponsavel,
  tokenDe,
  limparComunidade,
};
