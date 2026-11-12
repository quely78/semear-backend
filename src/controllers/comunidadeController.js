const comunidadeService = require('../services/comunidadeService');
const senhaService = require('../services/senhaService');
const { responderErro } = require('../utils/erros');

// O perfil (só responsável) é conferido na rota, pelo middleware soResponsavel.

/** Monta um handler que chama o service com a usuária logada e trata os erros do mesmo jeito. */
function responder(funcao) {
  return async (req, res) => {
    try {
      return res.status(200).json(await funcao(req.user));
    } catch (error) {
      return responderErro(res, error, 'Não foi possível carregar os dados da comunidade.');
    }
  };
}

async function listarComunidades(req, res) {
  try {
    return res.status(200).json(await comunidadeService.listarComunidades());
  } catch (error) {
    return responderErro(res, error, 'Não foi possível carregar as comunidades.');
  }
}

/** A responsável gera uma senha provisória para uma agricultora da comunidade dela. */
async function redefinirSenha(req, res) {
  try {
    return res.status(200).json(await senhaService.redefinirSenhaDaAgricultora(req.user, req.params.id));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível redefinir a senha agora. Tente novamente.');
  }
}

module.exports = {
  listarComunidades,
  redefinirSenha,
  agricultoras: responder(comunidadeService.agricultorasDaComunidade),
  plantios: responder(comunidadeService.plantiosDaComunidade),
  painel: responder(comunidadeService.painelDaComunidade),
};
