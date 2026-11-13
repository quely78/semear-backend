const express = require('express');
const autenticar = require('../middleware/auth');
const { soAgricultora } = require('../middleware/perfil');
const financasController = require('../controllers/financasController');

const router = express.Router();

// Resumo de todos os plantios da agricultora no período (?dataInicio=&dataFim=)
// As rotas de UM plantio ficam em /plantios/:id/financas, /gastos e /vendas.
router.get('/', autenticar, soAgricultora, financasController.daAgricultora);

module.exports = router;
