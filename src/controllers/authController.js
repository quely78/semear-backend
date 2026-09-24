const authService = require('../services/authService');

async function cadastrar(req, res) {
  try {
    const usuario = await authService.cadastrar(req.body);
    return res.status(201).json(usuario);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function login(req, res) {
  try {
    const resultado = await authService.login(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
}

module.exports = { cadastrar, login };
