const plantioService = require('../services/plantioService');

function agricultoraObrigatoria(req, res) {
  if (req.user.tipo !== 'AGRICULTORA') {
    res.status(403).json({ message: 'Apenas agricultoras podem gerenciar plantios.' });
    return false;
  }
  return true;
}

async function criar(req, res) {
  if (!agricultoraObrigatoria(req, res)) return;
  try {
    const plantio = await plantioService.criar(req.body, req.user.id);
    return res.status(201).json(plantio);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function listar(req, res) {
  if (!agricultoraObrigatoria(req, res)) return;
  try {
    return res.status(200).json(await plantioService.listar(req.user.id, req.query));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function editar(req, res) {
  if (!agricultoraObrigatoria(req, res)) return;
  try {
    return res.status(200).json(await plantioService.editar(req.params.id, req.body, req.user.id));
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function excluir(req, res) {
  if (!agricultoraObrigatoria(req, res)) return;
  try {
    await plantioService.excluir(req.params.id, req.user.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

module.exports = { criar, listar, editar, excluir };
