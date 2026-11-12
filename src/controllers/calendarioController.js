const calendarioService = require('../services/calendarioService');
const { responderErro } = require('../utils/erros');

async function consultarPorEspecie(req, res) {
  try {
    return res.status(200).json(await calendarioService.consultarPorEspecie(req.params.especie));
  } catch (error) {
    return responderErro(res, error, 'Não foi possível consultar o calendário agora.');
  }
}

module.exports = { consultarPorEspecie };
