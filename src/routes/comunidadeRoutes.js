const express = require('express');
const autenticar = require('../middleware/auth');
const comunidadeController = require('../controllers/comunidadeController');

const router = express.Router();

// Pública: o cadastro precisa listar as comunidades antes do login
router.get('/comunidades', comunidadeController.listarComunidades);

// Responsável pela comunidade
router.get('/coordenadora/agricultoras', autenticar, comunidadeController.agricultoras);
router.get('/coordenadora/plantios', autenticar, comunidadeController.plantios);
router.post(
  '/coordenadora/agricultoras/:id/redefinir-senha',
  autenticar,
  comunidadeController.redefinirSenha,
);

// Qualquer usuária logada: números da própria comunidade
router.get('/dashboard/comunidade', autenticar, comunidadeController.painel);

module.exports = router;
