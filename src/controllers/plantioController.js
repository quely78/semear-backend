const plantioService = require('../services/plantioService');
const { responderErro } = require('../utils/erros');

// O perfil (só agricultora) é conferido na rota, pelo middleware soAgricultora.

async function criar(req, res) {
  try {
    return res.status(201).json(await plantioService.criar(req.body, req.user.id));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível salvar o plantio agora. Tente novamente.');
  }
}

async function listar(req, res) {
  try {
    return res.status(200).json(await plantioService.listar(req.user.id, req.query));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível carregar os plantios agora.');
  }
}

async function editar(req, res) {
  try {
    return res.status(200).json(await plantioService.editar(req.params.id, req.body, req.user.id));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível salvar o plantio agora. Tente novamente.');
  }
}

async function excluir(req, res) {
  try {
    await plantioService.excluir(req.params.id, req.user.id);
    return res.status(204).send();
  } catch (error) {
    return responderErro(res, error, 'Não foi possível excluir o plantio agora. Tente novamente.');
  }
}

async function registrarColheita(req, res) {
  try {
    return res
      .status(200)
      .json(await plantioService.registrarColheita(req.params.id, req.body, req.user.id));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível registrar a colheita agora. Tente novamente.');
  }
}

async function desfazerColheita(req, res) {
  try {
    return res.status(200).json(await plantioService.desfazerColheita(req.params.id, req.user.id));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível desfazer a colheita agora. Tente novamente.');
  }
}

module.exports = { criar, listar, editar, excluir, registrarColheita, desfazerColheita };
