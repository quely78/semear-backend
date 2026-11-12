const perfilService = require('../services/perfilService');
const { responderErro } = require('../utils/erros');

async function obter(req, res) {
  try {
    return res.status(200).json(await perfilService.obterPerfil(req.user));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível carregar o perfil agora.');
  }
}

async function atualizar(req, res) {
  try {
    return res.status(200).json(await perfilService.atualizarPerfil(req.user, req.body));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível salvar o perfil agora. Tente novamente.');
  }
}

module.exports = { obter, atualizar };
