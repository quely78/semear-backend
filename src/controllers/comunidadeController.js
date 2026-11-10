const comunidadeService = require('../services/comunidadeService');

/** Só a responsável pela comunidade (COORDENADORA) acessa. */
function coordenadoraObrigatoria(req, res) {
  if (req.user.tipo !== 'COORDENADORA') {
    res.status(403).json({ message: 'Apenas a responsável pela comunidade pode ver estes dados.' });
    return false;
  }
  return true;
}

/** Monta um handler que chama o service e trata os erros do mesmo jeito. */
function responder(funcao, { soCoordenadora = false } = {}) {
  return async (req, res) => {
    if (soCoordenadora && !coordenadoraObrigatoria(req, res)) return;
    try {
      return res.status(200).json(await funcao(req.user));
    } catch (error) {
      if (error.status) return res.status(error.status).json({ message: error.message });
      console.error(error);
      return res.status(500).json({ message: 'Não foi possível carregar os dados da comunidade.' });
    }
  };
}

async function listarComunidades(req, res) {
  try {
    return res.status(200).json(await comunidadeService.listarComunidades());
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Não foi possível carregar as comunidades.' });
  }
}

module.exports = {
  listarComunidades,
  agricultoras: responder(comunidadeService.agricultorasDaComunidade, { soCoordenadora: true }),
  plantios: responder(comunidadeService.plantiosDaComunidade, { soCoordenadora: true }),
  painel: responder(comunidadeService.painelDaComunidade),
};
