const calendarioService = require('../services/calendarioService');

async function consultarPorEspecie(req, res) {
  try {
    const calendario = await calendarioService.consultarPorEspecie(req.params.especie);
    return res.status(200).json(calendario);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
}

module.exports = { consultarPorEspecie };
