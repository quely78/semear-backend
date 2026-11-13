const express = require('express');
const autenticar = require('../middleware/auth');
const { soAgricultora } = require('../middleware/perfil');
const plantioController = require('../controllers/plantioController');
const financasController = require('../controllers/financasController');

const router = express.Router();

// Todas as rotas de plantio: precisa de login e de ser agricultora
router.use(autenticar, soAgricultora);
router.post('/', plantioController.criar);
router.get('/', plantioController.listar);
router.put('/:id', plantioController.editar);
router.delete('/:id', plantioController.excluir);
router.put('/:id/colheita', plantioController.registrarColheita);
router.delete('/:id/colheita', plantioController.desfazerColheita);

// Finanças do plantio: gastos e vendas (venda = saída do que foi colhido)
router.get('/:id/financas', financasController.doPlantio);
router.post('/:id/gastos', financasController.criarGasto);
router.delete('/:id/gastos/:itemId', financasController.excluirGasto);
router.post('/:id/vendas', financasController.criarVenda);
router.delete('/:id/vendas/:itemId', financasController.excluirVenda);

module.exports = router;
