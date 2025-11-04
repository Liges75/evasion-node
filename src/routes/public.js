const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Accueil
router.get('/', publicController.home);

// FAQ
router.get('/faq', publicController.faq);

// Contact
router.get('/contact', publicController.getContact);
router.post('/contact', publicController.postContact);

// Résultats de recherche
router.get('/search', publicController.searchResults);

module.exports = router;

