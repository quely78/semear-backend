const express = require('express');
const calendarioController = require('../controllers/calendarioController');

const router = express.Router();

// Hoje as duas rotas são públicas. Para exigir login (item da Sprint 3), faça:
//   const autenticar = require('../middleware/auth');
//   router.get('/', autenticar, calendarioController.listar);
//   router.get('/:especie', autenticar, calendarioController.consultarPorEspecie);

// GET /calendario            -> todas as espécies
// GET /calendario?mes=3      -> o que plantar e colher em março
router.get('/', calendarioController.listar);

// GET /calendario/Milho      -> uma espécie
router.get('/:especie', calendarioController.consultarPorEspecie);

module.exports = router;
