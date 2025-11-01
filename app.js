
// je charge les module necessaire pour node, Express, JS et morgan

require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('./src/config/db');
const express = require('express');
const morgan = require('morgan'); //Middleware d'enregistrement de requêtes HTTP pour Node.js

// Middleware d'enregistrement de requêtes HTTP pour Node.js / Outil pour afficher les requêtes HTTP dans la console (utile pour voir ce qui se passe)
// Nommé d'après Dexter , une série pour ne pas dire, LA SERIE !
// https://last9.io/blog/morgan-npm-and-its-role-in-node-js/
// https://www.npmjs.com/package/morgan

const session = require('express-session');
const app = express();
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 3000; //L’opérateur OU logique (||) en JavaScript signifie : “Si la première valeur est falsy (nulle, vide, undefined…), prends la suivante.”


//  Configuration du moteur de vues (EJS) 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/src/views');

// Middlewares 
app.use(express.static('public'));               // Sert le CSS, images, JS front-end
app.use(express.urlencoded({ extended: true })); // Pour lire les formulaires
app.use(morgan('dev'));                          // Logs des requêtes dans la console
app.use(session({
  secret: 'evasion_secret_key',  // clé à personnaliser plus tard
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true si HTTPS plus tard poutla partie paiement
}));



// Middleware global pour rendre la session (connexion utilisateur) accessible à EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// --------------------------------Page réservée au utilisateur du site evasion (non client)----------------------------
app.get('/staff/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 1) {
    return res.redirect('/login');
  }

  try {
    // Derniers messages
    const [messages] = await db.promise().query(`
      SELECT nom, prenom, email, sujet, 
      DATE_FORMAT(date_message, '%d/%m/%Y à %H:%i') AS date_message,
      statut
      FROM message_contact
      ORDER BY date_message DESC
      LIMIT 5
    `);

    // Liste des clients
    const [clients] = await db.promise().query(`
      SELECT nom_user, prenom_user, email_user, tel_user, 
      DATE_FORMAT(date_inscription, '%d/%m/%Y') AS date_inscription
      FROM user
      WHERE id_role = 7
      ORDER BY date_inscription DESC
      LIMIT 10
    `);

    res.render('staff-dashboard', {
      title: 'Espace Utilisateur',
      user: req.session.user,
      messages,
      clients,
      showSearchBar: false
    });

  } catch (err) {
    console.error('Erreur chargement staff-dashboard :', err);
    res.status(500).send('Erreur lors du chargement du tableau de bord.');
  }
});


// ----------------------Page réservée aux admins Evasion----------------------------
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 2) {
    return res.redirect('/login');
  }

  try {
    const [users] = await db.promise().query('SELECT COUNT(*) AS nb_users FROM user');
    const [messages] = await db.promise().query('SELECT COUNT(*) AS nb_messages FROM message_contact');
    const [hotels] = await db.promise().query('SELECT COUNT(*) AS nb_hotels FROM hotel');

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
    console.error('Erreur chargement dashboard admin :', err);
    res.status(500).send('Erreur lors du chargement du tableau de bord admin.');
  }
});


// page publique pour les clients Evasion qui font le choix de se connecter ou non, mais voit ses resa si connecté uniquement
app.get('/client/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 7) {
    return res.redirect('/login');
  }

  try {
    // Récupération des réservations du client
    const [reservations] = await db.promise().query(`
      SELECT 
        r.id_reservation,
        d.nom_destination,
        r.date_arrivee,
        r.date_depart,
        r.montant_total,
        r.statut_reservation
      FROM reservation AS r
      LEFT JOIN offre AS o ON r.id_offre = o.id_offre
      LEFT JOIN hotel AS h ON o.id_chambre = h.id_hotel
      LEFT JOIN destination AS d ON h.id_destination = d.id_destination
      WHERE r.id_user = ?
      ORDER BY r.date_reservation DESC
    `, [req.session.user.id_user]);

    // Rendu de la page
    res.render('client-dashboard', { 
      title: 'Mon compte Evasion', 
      user: req.session.user, 
      reservations, 
      showSearchBar: false 
    });

  } catch (err) {
    console.error('Erreur chargement réservations client :', err);
    res.status(500).send('Erreur serveur lors du chargement de votre compte.');
  }
});



// direction la page d'acceuil
app.get('/', (req, res) => {
  res.render('home', { title: 'Evasion - Accueil' ,
  showSearchBar: true //la barre de recherche s'affiche sur la page d’accueil uniquement.
  });
});

app.get('/search', (req, res) => {
  res.render('search-results', { 
    title: 'Résultats de recherche',
    showSearchBar: false
  });
});

// Page Contact formulaire pour avancer sur le cours avec Gilbert
app.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contactez-nous', 
    showSearchBar: false,
    success: false, 
    nom: ''
  });
});

// // récupération des données du formulaire dans la console pour l'instant
// app.post('/contact', (req, res) => {
//   const { nom, prenom, email, sujet, message } = req.body;
//   console.log('Nouveau message reçu :');
//   console.log('Nom :', nom);
//   console.log('Prénom :', prenom);
//   console.log('Email :', email);
//   console.log('Sujet :', sujet);
//   console.log('Message :', message);

//   // Réaffiche la page avec un message de confirmation 
//   res.render('contact', {
//     title: 'Contactez-nous',
//     showSearchBar: false,
//     success: true,
//     nom: prenom
//   });
// });

//Enregistrement des messages de contact dans la BDD
app.post('/contact', (req, res) => {
  const { nom, prenom, email, sujet, message } = req.body;

  //Pour le moment, id_user test fixe (à adapter plus tard)
  const id_user = 2; 

  //requête SQL d'insertion
  const sql = `
    INSERT INTO message_contact 
    (nom, prenom, email, sujet, message, date_message, statut, id_user)
    VALUES (?, ?, ?, ?, ?, NOW(), 'non lu', ?)
  `;

  //Envoi dans la base
  db.query(sql, [nom, prenom, email, sujet, message, id_user], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'insertion du message :', err);
      return res.status(500).send('Erreur lors de l\'envoi du message.');
    }

    console.log('Message ajouté avec succès dans la BDD, ID :', result.insertId);

    //  la page avec confirmation
    res.render('contact', {
      title: 'Contactez-nous',
      showSearchBar: false,
      success: true,
      nom: prenom
    });
  });
});

  // Formulaire d'inscription client
app.get('/register', (req, res) => {
  res.render('register', { 
    title: "Créer un compte", 
    error: null, 
    success: false, 
    showSearchBar: false 
  });
});

app.post('/register', async (req, res) => {
  const { 
    nom, prenom, email, password, tel, date_naissance, ok_newsletter,
    rue, complement, code_postal, ville, pays
  } = req.body;

  try {
    //1  Vérifie si l’e-mail existe déjà
    const [existing] = await db.promise().query('SELECT * FROM user WHERE email_user = ?', [email]);
    if (existing.length > 0) {
      return res.render('register', { 
        title: "Créer un compte", 
        error: "Un compte existe déjà avec cet email.", 
        success: false, 
        showSearchBar: false 
      });
    }

    //2  Hachage du mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    //3  ajout de l’adresse
    const [adresseResult] = await db.promise().query(`
      INSERT INTO adresse (rue, complement, code_postal, ville, pays)
      VALUES (?, ?, ?, ?, ?)`,
      [rue, complement, code_postal, ville, pays]
    );

    const id_adresse = adresseResult.insertId;

    //4 Ajout de l’utilisateur avec mot de passe chiffré
    await db.promise().query(`
      INSERT INTO user (
        nom_user, prenom_user, email_user, password_user, tel_user,
        date_inscription, id_role, ok_newsletter, date_naissance, id_adresse
      )
      VALUES (?, ?, ?, ?, ?, NOW(), 7, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, tel, ok_newsletter ? 1 : 0, date_naissance, id_adresse]
    );

    //5 Succès
    res.render('register', { 
      title: "Créer un compte", 
      success: true, 
      error: null, 
      showSearchBar: false 
    });

  } catch (err) {
    console.error('Erreur inscription sécurisée :', err);
    res.status(500).send('Erreur serveur lors de la création du compte.');
  }
});

// ----------------------------------- PAGE DE CONNEXION -----------------------------------------------
app.get('/login', (req, res) => {
  res.render('login', {
    title: 'Connexion',
    showSearchBar: false,
    error: null,
    success: null
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const [rows] = await db.promise().query('SELECT * FROM user WHERE email_user = ?', [email]);
    if (rows.length === 0) {
      return res.render('login', {
        title: 'Connexion',
        showSearchBar: false,
        error: 'Aucun compte trouvé avec cet e-mail.',
        success: null
      });
    }

    const user = rows[0];

    // Vérifier le mot de passe
    const match = await bcrypt.compare(password, user.password_user);
    if (!match) {
      return res.render('login', {
        title: 'Connexion',
        showSearchBar: false,
        error: 'Mot de passe incorrect.',
        success: null
      });
    }

    // Stocker les infos utilisateur en session
    req.session.user = {
      id: user.id_user,
      nom: user.nom_user,
      prenom: user.prenom_user,
      email: user.email_user,
      role: user.id_role
    };

    console.log('Connexion réussie pour :', user.email_user);

    // Rediriger selon le rôle
    if (user.id_role === 2) {
      return res.redirect('/admin/dashboard');
    } else if (user.id_role === 1) {
      return res.redirect('/staff/dashboard');
    } else {
      return res.redirect('/client/dashboard');
    }

  } catch (err) {
    console.error('Erreur de connexion :', err);
    res.status(500).send('Erreur serveur.');
  }
});


// -------------------------------------------------------------appelle de la page FAQ----------------------------------
app.get('/faq', (req, res) => {
  res.render('faq', { 
    title: 'Questions fréquentes',
    showSearchBar: false
  });
});

// Page d'administration : affichage des messages reçus
app.get('/admin/messages', (req, res) => {
  const sql = `
    SELECT 
      id_message, 
      nom, 
      prenom, 
      email, 
      id_user,
      sujet, 
      message, 
      DATE_FORMAT(date_message, '%d/%m/%Y à %H:%i') AS date_message,
      statut
    FROM message_contact
    ORDER BY date_message DESC
  `;

  app.post('/admin/messages/:id/statut', (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const sql = 'UPDATE message_contact SET statut = ? WHERE id_message = ?';
  db.query(sql, [statut, id], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du statut :', err);
      return res.status(500).send('Erreur serveur.');
    }
    console.log(`Message ${id} mis à jour : ${statut}`);
    res.redirect('/admin/messages');
  });
});

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des messages :', err);
      return res.status(500).send('Erreur lors du chargement des messages.');
    }

    res.render('admin-messages', { 
      title: 'Messages reçus', 
      messages: results, 
      showSearchBar: false 
    });
  });
});

// Page Admin pour les utilisateurs 
app.get('/admin/utilisateurs', (req, res) => {
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

  db.query(sql, (err, users) => {
    if (err) {
      console.error('Erreur lors du chargement des utilisateurs :', err);
      return res.status(500).send('Erreur lors du chargement des utilisateurs.');
    }
    res.render('admin-utilisateurs', { 
      title: 'Liste des utilisateurs', 
      users,
      showSearchBar: false
    });
  });
});


// ----------------------------------- PAGE pour les mot de passe oubliés-----------------------------------------------
const crypto = require('crypto');
const transporter = require('./src/config/mailer');

// Affichage du formulaire
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { title: "Mot de passe oublié", success: false, error: null, showSearchBar: false });
});

// Traitement du formulaire
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifie si l'utilisateur existe
    const [rows] = await db.promise().query('SELECT id_user, prenom_user FROM user WHERE email_user = ?', [email]);
    if (rows.length === 0) {
      return res.render('forgot-password', { title: "Mot de passe oublié", success: false, error: "Aucun compte trouvé avec cet e-mail.", showSearchBar: false });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // +1h

    // Enregistre le token
    await db.promise().query(
      'INSERT INTO password_reset (id_user, token, expires_at) VALUES (?, ?, ?)',
      [user.id_user, token, expires]
    );

    // Envoi de l’email
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Evasion',
      html: `
        <p>Bonjour ${user.prenom_user},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p><a href="${resetLink}">Cliquez ici pour le réinitialiser</a></p>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.</p>
      `
    });

    res.render('forgot-password', { title: "Mot de passe oublié", success: true, error: null, showSearchBar: false });
  } catch (err) {
    console.error('Erreur reset password :', err);
    res.status(500).send('Erreur lors de la demande de réinitialisation.');
  }
});

// Affichage du formulaire
app.get('/reset-password', async (req, res) => {
  const { token } = req.query;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM password_reset WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.render('reset-password', { title: "Lien invalide ou expiré", token: null, error: "Lien invalide ou expiré.", success: false, showSearchBar: false });
    }

    res.render('reset-password', { title: "Réinitialiser le mot de passe", token, error: null, success: false, showSearchBar: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur.');
  }
});

// Traitement du nouveau mot de passe
app.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const [rows] = await db.promise().query(
      'SELECT id_user FROM password_reset WHERE token = ? AND used = 0 AND expires_at > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.render('reset-password', { title: "Lien invalide", token: null, error: "Ce lien n’est plus valide.", success: false, showSearchBar: false });
    }

    const userId = rows[0].id_user;
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.promise().query('UPDATE user SET password_user = ? WHERE id_user = ?', [hashedPassword, userId]);
    await db.promise().query('UPDATE password_reset SET used = 1 WHERE token = ?', [token]);

    res.render('reset-password', { title: "Mot de passe réinitialisé", token: null, success: true, error: null, showSearchBar: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la mise à jour du mot de passe.');
  }
});


// -------------------------Déconnexion utilisateur-------------------

app.get('/logout', (req, res) => {
  // Supprime la session de l'utilisateur
  req.session.destroy((err) => {
    if (err) {
      console.error('Erreur lors de la déconnexion :', err);
      return res.status(500).send('Erreur lors de la déconnexion.');
    }

    // Supprime le cookie de session côté client
    res.clearCookie('connect.sid');

    // Redirige vers la page d'accueil
    res.redirect('/');
  });
});


// ecoute du serveur
app.listen(PORT, () => {
  console.log(`Serveur Evasion lancé sur http://localhost:${PORT}`);
}); 
