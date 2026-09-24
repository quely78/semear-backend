const express = require('express');
const autenticar = require('../middleware/auth');
const plantioController = require('../controllers/plantioController');

const router = express.Router();

router.use(autenticar);
router.post('/', plantioController.criar);
router.get('/', plantioController.listar);
router.put('/:id', plantioController.editar);
router.delete('/:id', plantioController.excluir);

module.exports = router;
