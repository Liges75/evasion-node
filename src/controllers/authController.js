const bcrypt = require('bcrypt');
const { promisePool } = require('../config/db'); // ✅ version promesse
const crypto = require('crypto');
const transporter = require('../config/mailer');

// ------------------- inscritpino -------------------

exports.registerPage = (req, res) => {
  res.render('register', { title: 'Créer un compte', error: null, success: false, showSearchBar: false });
};

exports.registerUser = async (req, res) => {
  const { nom, prenom, email, password, tel, date_naissance, ok_newsletter, rue, complement, code_postal, ville, pays } = req.body;

  try {
    const [existing] = await promisePool.query('SELECT * FROM user WHERE email_user = ?', [email]);
    if (existing.length > 0) {
      return res.render('register', { title: 'Créer un compte', error: 'Un compte existe déjà avec cet email.', success: false, showSearchBar: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [adresseResult] = await promisePool.query(
      'INSERT INTO adresse (rue, complement, code_postal, ville, pays) VALUES (?, ?, ?, ?, ?)',
      [rue, complement, code_postal, ville, pays]
    );
    const id_adresse = adresseResult.insertId;

    await promisePool.query(
      `INSERT INTO user (nom_user, prenom_user, email_user, password_user, tel_user, date_inscription, id_role, ok_newsletter, date_naissance, id_adresse)
       VALUES (?, ?, ?, ?, ?, NOW(), 7, ?, ?, ?)`,
      [nom, prenom, email, hashedPassword, tel, ok_newsletter ? 1 : 0, date_naissance, id_adresse]
    );

    res.render('register', { title: 'Créer un compte', success: true, error: null, showSearchBar: false });
  } catch (err) {
    console.error('Erreur inscription :', err);
    res.status(500).send('Erreur serveur lors de la création du compte.');
  }
};

// ------------------- login -------------------

exports.loginPage = (req, res) => {
  res.render('login', { title: 'Connexion', showSearchBar: false, error: null, success: null });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await promisePool.query('SELECT * FROM user WHERE email_user = ?', [email]);
    if (rows.length === 0) {
      return res.render('login', { title: 'Connexion', showSearchBar: false, error: 'Aucun compte trouvé.', success: null });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_user);
    if (!match) {
      return res.render('login', { title: 'Connexion', showSearchBar: false, error: 'Mot de passe incorrect.', success: null });
    }

    req.session.user = {
      id_user: user.id_user,
      nom: user.nom_user,
      prenom: user.prenom_user,
      email: user.email_user,
      role: user.id_role
    };

    if (user.id_role === 2) return res.redirect('/admin/dashboard');
    if (user.id_role === 1) return res.redirect('/staff/dashboard');
    return res.redirect('/client/dashboard');

  } catch (err) {
    console.error('Erreur login :', err);
    res.status(500).send('Erreur serveur.');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};

// ------------------- mdp oublié-------------------

exports.forgotPasswordPage = (req, res) => {
  res.render('forgot-password', { title: 'Mot de passe oublié', success: false, error: null, showSearchBar: false });
};

exports.forgotPasswordSend = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await promisePool.query('SELECT id_user, prenom_user FROM user WHERE email_user = ?', [email]);
    if (rows.length === 0) {
      return res.render('forgot-password', { title: 'Mot de passe oublié', success: false, error: 'Aucun compte trouvé.', showSearchBar: false });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await promisePool.query('INSERT INTO password_reset (id_user, token, expires_at) VALUES (?, ?, ?)', [user.id_user, token, expires]);

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Bonjour ${user.prenom_user}, cliquez <a href="${resetLink}">ici</a> pour réinitialiser votre mot de passe.</p>`
    });

    res.render('forgot-password', { title: 'Mot de passe oublié', success: true, error: null, showSearchBar: false });
  } catch (err) {
    console.error('Erreur reset password :', err);
    res.status(500).send('Erreur lors de la demande de réinitialisation.');
  }
};

exports.resetPasswordPage = async (req, res) => {
  const { token } = req.query;
  try {
    const [rows] = await promisePool.query('SELECT * FROM password_reset WHERE token = ? AND used = 0 AND expires_at > NOW()', [token]);
    if (rows.length === 0) {
      return res.render('reset-password', { title: 'Lien expiré', token: null, error: 'Lien invalide', success: false, showSearchBar: false });
    }
    res.render('reset-password', { title: 'Réinitialiser le mot de passe', token, error: null, success: false, showSearchBar: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur.');
  }
};

exports.resetPasswordSubmit = async (req, res) => {
  const { token, password } = req.body;
  try {
    const [rows] = await promisePool.query('SELECT id_user FROM password_reset WHERE token = ? AND used = 0 AND expires_at > NOW()', [token]);
    if (rows.length === 0) {
      return res.render('reset-password', { title: 'Lien expiré', token: null, error: 'Lien invalide', success: false, showSearchBar: false });
    }
    const userId = rows[0].id_user;
    const hashedPassword = await bcrypt.hash(password, 10);
    await promisePool.query('UPDATE user SET password_user = ? WHERE id_user = ?', [hashedPassword, userId]);
    await promisePool.query('UPDATE password_reset SET used = 1 WHERE token = ?', [token]);
    res.render('reset-password', { title: 'Mot de passe réinitialisé', token: null, success: true, error: null, showSearchBar: false });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la mise à jour du mot de passe.');
  }
};
