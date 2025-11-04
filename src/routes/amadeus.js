// src/routes/amadeus.js

const express = require('express');
const router = express.Router();
const amadeusController = require('../controllers/amadeusController');


// Route de recherche d’hôtels

router.get('/search', amadeusController.search);

module.exports = router;
