const authService = require('../services/authService');
const senhaService = require('../services/senhaService');
const { responderErro } = require('../utils/erros');

async function cadastrar(req, res) {
  try {
    const usuario = await authService.cadastrar(req.body);
    return res.status(201).json(usuario);
  } catch (error) {
    return responderErro(res, error, 'Não foi possível concluir o cadastro. Tente novamente.');
  }
}

async function login(req, res) {
  try {
    const resultado = await authService.login(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return responderErro(res, error, 'Não foi possível entrar agora. Tente novamente.');
  }
}

/** Troca a senha da usuária logada (inclusive depois de uma senha provisória). */
async function trocarSenha(req, res) {
  try {
    await senhaService.trocarSenha(req.user, req.body);
    return res.status(200).json({ message: 'Senha alterada.' });
  } catch (error) {
    return responderErro(res, error, 'Não foi possível trocar a senha agora. Tente novamente.');
  }
}

/** Esqueci minha senha: manda o link por e-mail (resposta igual exista a conta ou não). */
async function esqueciSenha(req, res) {
  try {
    await senhaService.solicitarRedefinicao(req.body);
    return res.status(200).json({
      message: 'Se esse e-mail tiver uma conta no SemeAR, enviamos um link para criar uma senha nova.',
    });
  } catch (error) {
    return responderErro(res, error, 'Não foi possível enviar o e-mail agora. Tente novamente mais tarde.');
  }
}

/** Confere se o link do e-mail ainda vale. */
async function validarLink(req, res) {
  try {
    await senhaService.validarLink(req.body);
    return res.status(200).json({ valido: true });
  } catch (error) {
    return responderErro(res, error);
  }
}

/** Cria a senha nova usando o link do e-mail. */
async function redefinirSenha(req, res) {
  try {
    await senhaService.redefinirComLink(req.body);
    return res.status(200).json({ message: 'Senha alterada.' });
  } catch (error) {
    return responderErro(res, error, 'Não foi possível trocar a senha agora. Tente novamente.');
  }
}

module.exports = { cadastrar, login, trocarSenha, esqueciSenha, validarLink, redefinirSenha };
