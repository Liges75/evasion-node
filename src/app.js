
// je charge les module necessaire pour node, Express, JS et morgan

require('dotenv').config();
const express = require('express');
const morgan = require('morgan'); //Middleware d'enregistrement de requêtes HTTP pour Node.js

//Middleware d'enregistrement de requêtes HTTP pour Node.js / Outil pour afficher les requêtes HTTP dans la console (utile pour voir ce qui se passe)
//Nommé d'après Dexter , une série que vous ne devriez pas regarder avant la fin.
// https://last9.io/blog/morgan-npm-and-its-role-in-node-js/
// https://www.npmjs.com/package/morgan


const app = express();
const PORT = process.env.PORT || 3000; //L’opérateur OU logique (||) en JavaScript signifie : “Si la première valeur est falsy (nulle, vide, undefined…), prends la suivante.”


//  Configuration du moteur de vues (EJS) 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Middlewares 
app.use(express.static('public'));               // Sert le CSS, images, JS front-end
app.use(express.urlencoded({ extended: true })); // Pour lire les formulaires
app.use(morgan('dev'));                          // Logs des requêtes dans la console

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

// ecoute du serveur
app.listen(PORT, () => {
  console.log(`Serveur Evasion lancé sur http://localhost:${PORT}`);
}); 
