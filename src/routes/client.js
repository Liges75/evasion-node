const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { isClient } = require('../middlewares/auth');

// Tableau de bord client
router.get('/dashboard', isClient, clientController.dashboard);

module.exports = router;
