const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { isStaff } = require('../middlewares/auth');

// Tableau de bord du staff
router.get('/dashboard', isStaff, staffController.dashboard);

module.exports = router;
