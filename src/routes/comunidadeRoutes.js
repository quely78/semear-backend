const express = require('express');
const autenticar = require('../middleware/auth');
const { soResponsavel } = require('../middleware/perfil');
const comunidadeController = require('../controllers/comunidadeController');
const financasController = require('../controllers/financasController');

const router = express.Router();

// Pública: o cadastro precisa listar as comunidades antes do login
router.get('/comunidades', comunidadeController.listarComunidades);

// Só a responsável pela comunidade (login + perfil COORDENADORA)
const responsavel = [autenticar, soResponsavel];
router.get('/coordenadora/agricultoras', ...responsavel, comunidadeController.agricultoras);
router.get('/coordenadora/plantios', ...responsavel, comunidadeController.plantios);
router.post(
  '/coordenadora/agricultoras/:id/redefinir-senha',
  ...responsavel,
  comunidadeController.redefinirSenha,
);
// Totais de vendas e gastos da comunidade (sem o valor de cada agricultora)
router.get('/coordenadora/financas', ...responsavel, financasController.daComunidade);

// Qualquer usuária logada: números da própria comunidade
router.get('/dashboard/comunidade', autenticar, comunidadeController.painel);

module.exports = router;
