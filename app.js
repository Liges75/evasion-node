
// -----------------Evasion - Serveur Node.js


// Chargement des modules nécessaires
require('dotenv').config({ path: __dirname + '/../.env' });
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');
const db = require('./src/config/db');

// Initialisation de l’application
const app = express();
const PORT = process.env.PORT || 3000;


//-----------------Configuration générale


// Moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Fichiers statiques (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Middlewares
app.use(express.urlencoded({ extended: true })); // lecture des formulaires
app.use(morgan('dev')); // log des requêtes


// Sessions utilisateurs
app.use(session({
  secret: process.env.SESSION_SECRET, // la clé de session ne sera pas visible dans le code.
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // à true uniquement en HTTPS
}));

// Middleware global : rendre la session accessible à toutes les vues
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


//--------------------------Import des routes

const publicRoutes = require('./src/routes/public');
const authRoutes = require('./src/routes/auth');
const adminRoutes = require('./src/routes/admin');
const staffRoutes = require('./src/routes/staff');
const clientRoutes = require('./src/routes/client');

const amadeusRoutes = require('./src/routes/amadeus');
app.use('/', amadeusRoutes);


//------------------------- Utilisation des routes

app.use('/', publicRoutes);      // pages publiques (home, contact, faq…)
app.use('/', authRoutes);        // login, register, reset-password
app.use('/admin', adminRoutes);  // espace administrateur
app.use('/staff', staffRoutes);  // espace staff
app.use('/client', clientRoutes);// espace client


//----------------------------Lancement du serveur

app.listen(PORT, () => {
  console.log(`✅ Serveur Evasion lancé sur http://localhost:${PORT}`);
});
