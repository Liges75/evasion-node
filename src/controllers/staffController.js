
//Staff Controller - Evasion

const { promisePool } = require('../config/db');


// Tableau de bord Staff

exports.dashboard = async (req, res) => {
  try {
    // 🔹 Derniers messages
    const [messages] = await promisePool.query(`
      SELECT 
        nom, prenom, email, sujet,
        DATE_FORMAT(date_message, '%d/%m/%Y à %H:%i') AS date_message,
        statut
      FROM message_contact
      ORDER BY date_message DESC
      LIMIT 5
    `);

    // Derniers clients inscrits
    const [clients] = await promisePool.query(`
      SELECT 
        nom_user, prenom_user, email_user, tel_user,
        DATE_FORMAT(date_inscription, '%d/%m/%Y') AS date_inscription
      FROM user
      WHERE id_role = 7
      ORDER BY date_inscription DESC
      LIMIT 10
    `);

    //Rendu de la page
    res.render('staff-dashboard', {
      title: 'Espace Staff Evasion',
      user: req.session.user,
      messages,
      clients,
      showSearchBar: false
    });

  } catch (err) {
    console.error('Erreur staff-dashboard :', err);
    res.status(500).send('Erreur chargement tableau de bord staff.');
  }
};
