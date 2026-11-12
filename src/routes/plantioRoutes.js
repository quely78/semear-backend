const express = require('express');
const autenticar = require('../middleware/auth');
const { soAgricultora } = require('../middleware/perfil');
const plantioController = require('../controllers/plantioController');

const router = express.Router();

// Todas as rotas de plantio: precisa de login e de ser agricultora
router.use(autenticar, soAgricultora);
router.post('/', plantioController.criar);
router.get('/', plantioController.listar);
router.put('/:id', plantioController.editar);
router.delete('/:id', plantioController.excluir);
router.put('/:id/colheita', plantioController.registrarColheita);
router.delete('/:id/colheita', plantioController.desfazerColheita);

module.exports = router;
