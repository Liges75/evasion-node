
// Admin Controller - Evasion

const { promisePool, pool } = require('../config/db');


// Tableau de bord Admin

exports.dashboard = async (req, res) => {
  try {
    const [users] = await promisePool.query('SELECT COUNT(*) AS nb_users FROM user');
    const [messages] = await promisePool.query('SELECT COUNT(*) AS nb_messages FROM message_contact');
    const [hotels] = await promisePool.query('SELECT COUNT(*) AS nb_hotels FROM hotel');

    const stats = {
      nb_users: users[0].nb_users,
      nb_messages: messages[0].nb_messages,
      nb_hotels: hotels[0].nb_hotels
    };

    res.render('admin-dashboard', {
      title: 'Espace Administrateur',
      user: req.session.user,
      stats,
      showSearchBar: false
    });
  } catch (err) {
    console.error('Erreur dashboard admin :', err);
    res.status(500).send('Erreur chargement du tableau de bord admin.');
  }
};


// Gestion des messages contact

exports.messages = (req, res) => {
  const sql = `
    SELECT 
      id_message, nom, prenom, email, id_user, sujet, message,
      DATE_FORMAT(date_message, '%d/%m/%Y à %H:%i') AS date_message,
      statut
    FROM message_contact
    ORDER BY date_message DESC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur chargement messages :', err);
      return res.status(500).send('Erreur lors du chargement des messages.');
    }

    res.render('admin-messages', { 
      title: 'Messages reçus', 
      messages: results, 
      showSearchBar: false 
    });
  });
};


// Mise à jour du statut d’un message

exports.updateMessageStatus = (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;
  const sql = 'UPDATE message_contact SET statut = ? WHERE id_message = ?';

  pool.query(sql, [statut, id], (err) => {
    if (err) {
      console.error('Erreur maj statut :', err);
      return res.status(500).send('Erreur serveur.');
    }
    res.redirect('/admin/messages');
  });
};


// Liste des utilisateurs

exports.users = (req, res) => {
  const sql = `
    SELECT 
      u.id_user,
      u.nom_user,
      u.prenom_user,
      u.email_user,
      u.tel_user,
      DATE_FORMAT(u.date_inscription, '%d/%m/%Y à %H:%i') AS date_inscription,
      r.nom_role,
      a.rue,
      a.complement,
      a.code_postal,
      a.ville,
      a.pays
    FROM user AS u
    LEFT JOIN adresse AS a ON u.id_adresse = a.id_adresse
    LEFT JOIN roles AS r ON u.id_role = r.id_role
    ORDER BY u.id_user ASC;
  `;

  pool.query(sql, (err, users) => {
    if (err) {
      console.error('Erreur chargement utilisateurs :', err);
      return res.status(500).send('Erreur chargement utilisateurs.');
    }

    res.render('admin-utilisateurs', { 
      title: 'Liste des utilisateurs', 
      users, 
      showSearchBar: false 
    });
  });
};
