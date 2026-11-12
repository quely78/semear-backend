const { erroDeValidacao } = require('../utils/erros');

const TIPOS = ['AGRICULTORA', 'COORDENADORA'];

// Mesmas regras do front-end (frontend/src/utils/validacoes.js)
const SENHA_MINIMA = 6;
const SENHA_MAXIMA = 72; // o bcrypt só considera os primeiros 72 bytes
const NOME_MAXIMO = 100;
const CONTATO_MAXIMO = 120;

const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/** O contato é um e-mail? */
function ehEmail(contato) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contato);
}

/** Telefone (8 a 13 dígitos, com ou sem DDD) ou e-mail. */
function contatoValido(contato) {
  const email = ehEmail(contato);
  const digitos = contato.replace(/\D/g, '');
  const ehTelefone = /^[\d\s()+.-]+$/.test(contato) && digitos.length >= 8 && digitos.length <= 13;
  return email || ehTelefone;
}

/** Regra do nome (cadastro e perfil). Recebe o nome já sem espaços nas pontas. */
function erroDoNome(nome) {
  if (!nome) return 'Informe o nome.';
  if (nome.length > NOME_MAXIMO) return `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`;
  return '';
}

/** Regra do contato (cadastro e perfil). Recebe o contato já sem espaços nas pontas. */
function erroDoContato(contato) {
  if (!contato) return 'Informe um telefone ou e-mail.';
  if (contato.length > CONTATO_MAXIMO || !contatoValido(contato)) return 'Digite um telefone ou e-mail válido.';
  return '';
}

/**
 * Confere o corpo do PUT /perfil (nome e contato) e devolve os dados limpos.
 * @throws {ErroApi} 400 com { campos }
 */
function validarPerfil(body = {}) {
  const nome = texto(body.nome);
  const contato = texto(body.contato);
  const campos = {};
  const erroNome = erroDoNome(nome);
  if (erroNome) campos.nome = erroNome;
  const erroContato = erroDoContato(contato);
  if (erroContato) campos.contato = erroContato;
  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { nome, contato };
}

/** Regra da senha (cadastro e troca de senha). Devolve a mensagem de erro ou ''. */
function erroDaSenha(senha) {
  if (senha === undefined || senha === null || senha === '') return 'Crie uma senha.';
  if (typeof senha !== 'string') return 'A senha precisa ser enviada como texto.';
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (Buffer.byteLength(senha) > SENHA_MAXIMA) return 'A senha está longa demais.';
  return '';
}

/**
 * Confere o corpo da troca de senha.
 * @throws {ErroApi} 400 com { campos }
 */
function validarTrocaDeSenha(body = {}) {
  const { senhaAtual, novaSenha } = body;
  const campos = {};
  if (typeof senhaAtual !== 'string' || !senhaAtual) campos.senhaAtual = 'Informe a senha atual.';
  const erroNova = erroDaSenha(novaSenha);
  if (erroNova) campos.novaSenha = erroNova;
  else if (novaSenha === senhaAtual) campos.novaSenha = 'A senha nova precisa ser diferente da atual.';
  if (Object.keys(campos).length) throw erroDeValidacao(campos);
  return { senhaAtual, novaSenha };
}

/**
 * Confere o corpo do cadastro e devolve os dados limpos.
 * Junta todos os problemas de uma vez (um por campo) em vez de parar no primeiro.
 * A existência da comunidade é conferida depois, no service, porque precisa do banco.
 * @throws {ErroApi} 400 com { campos }
 */
function validarCadastro(body = {}) {
  const campos = {};
  const nome = texto(body.nome);
  const contato = texto(body.contato);
  const { senha, tipo } = body;

  const erroNome = erroDoNome(nome);
  if (erroNome) campos.nome = erroNome;
  const erroContato = erroDoContato(contato);
  if (erroContato) campos.contato = erroContato;

  const erroSenha = erroDaSenha(senha);
  if (erroSenha) campos.senha = erroSenha;

  if (!TIPOS.includes(tipo)) campos.tipo = 'tipo deve ser AGRICULTORA ou COORDENADORA.';

  // comunidadeId: obrigatório para agricultora; se vier, precisa ser um id válido
  const semComunidade = body.comunidadeId === undefined || body.comunidadeId === null || body.comunidadeId === '';
  const comunidadeId = Number(body.comunidadeId);
  if (semComunidade) {
    if (tipo === 'AGRICULTORA') campos.comunidadeId = 'Escolha sua comunidade.';
  } else if (!Number.isInteger(comunidadeId) || comunidadeId <= 0) {
    campos.comunidadeId = 'Comunidade inválida.';
  }

  if (Object.keys(campos).length) throw erroDeValidacao(campos);

  return { nome, contato, senha, tipo, comunidadeId: semComunidade ? null : comunidadeId };
}

module.exports = { validarCadastro, validarPerfil, validarTrocaDeSenha, erroDaSenha, ehEmail };
