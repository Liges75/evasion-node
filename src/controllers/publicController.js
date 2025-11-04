
// Public Controller - Evasion

const { pool } = require('../config/db');


// Page d’accueil

exports.home = (req, res) => {
  res.render('home', { title: 'Evasion - Accueil', showSearchBar: true });
};


// Page FAQ

exports.faq = (req, res) => {
  res.render('faq', { title: 'Questions fréquentes', showSearchBar: false });
};


// Page Contact - GET

exports.getContact = (req, res) => {
  res.render('contact', { 
    title: 'Contactez-nous', 
    showSearchBar: false, 
    success: false, 
    nom: '' 
  });
};


// Page Contact - POST (envoi du formulaire)

exports.postContact = (req, res) => {
  const { nom, prenom, email, sujet, message } = req.body;
  const id_user = req.session?.user?.id_user || null;

  const sql = `
    INSERT INTO message_contact 
    (nom, prenom, email, sujet, message, date_message, statut, id_user)
    VALUES (?, ?, ?, ?, ?, NOW(), 'non lu', ?)
  `;

  pool.query(sql, [nom, prenom, email, sujet, message, id_user], (err) => {
    if (err) {
      console.error('Erreur insertion message :', err);
      return res.status(500).send('Erreur lors de l’envoi du message.');
    }

    res.render('contact', { 
      title: 'Contactez-nous', 
      showSearchBar: false, 
      success: true, 
      nom: prenom 
    });
  });
};


// Page Résultats de recherche

exports.searchResults = (req, res) => {
  res.render('search-results', { 
    title: 'Résultats de recherche', 
    showSearchBar: false 
  });
};
