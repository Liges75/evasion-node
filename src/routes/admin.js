const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middlewares/auth');

// Tableau de bord Admin
router.get('/dashboard', isAdmin, adminController.dashboard);

// Messages reçus
router.get('/messages', isAdmin, adminController.messages);
router.post('/messages/:id/statut', isAdmin, adminController.updateMessageStatus);

// Gestion des utilisateurs
router.get('/utilisateurs', isAdmin, adminController.users);

module.exports = router;
