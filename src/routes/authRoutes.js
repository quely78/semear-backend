const express = require('express');
const autenticar = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/cadastro', authController.cadastrar);
router.post('/login', authController.login);
router.post('/trocar-senha', autenticar, authController.trocarSenha);

// Esqueci minha senha (por e-mail): não precisam de login
router.post('/esqueci-senha', authController.esqueciSenha);
router.post('/redefinir-senha/validar', authController.validarLink);
router.post('/redefinir-senha', authController.redefinirSenha);

module.exports = router;
