const express = require('express');
const autenticar = require('../middleware/auth');
const limites = require('../middleware/limites');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/cadastro', limites.cadastro, authController.cadastrar);
router.post('/login', limites.loginPorIp, limites.loginPorConta, authController.login);
router.post('/trocar-senha', autenticar, authController.trocarSenha);

// Esqueci minha senha (por e-mail): não precisam de login
router.post('/esqueci-senha', limites.recuperacaoDeSenha, authController.esqueciSenha);
router.post('/redefinir-senha/validar', limites.recuperacaoDeSenha, authController.validarLink);
router.post('/redefinir-senha', limites.recuperacaoDeSenha, authController.redefinirSenha);

module.exports = router;
