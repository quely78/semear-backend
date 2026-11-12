const express = require('express');
const autenticar = require('../middleware/auth');
const perfilController = require('../controllers/perfilController');

const router = express.Router();

// Perfil da usuária logada (agricultora ou responsável)
router.use(autenticar);
router.get('/', perfilController.obter);
router.put('/', perfilController.atualizar);

module.exports = router;
