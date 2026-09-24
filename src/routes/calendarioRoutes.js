const express = require('express');
const calendarioController = require('../controllers/calendarioController');

const router = express.Router();

router.get('/:especie', calendarioController.consultarPorEspecie);

module.exports = router;
