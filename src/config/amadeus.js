
//  Configuration de l'API d'Amadeus : https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/quick-start/?utm_source=homepage#step-2-get-your-api-key

// Axios est une bibliothèque JavaScript qui permet de faire des requêtes HTTP (GET, POST, PUT, DELETE…) vers une API pour envoyer ou récupérer des données, en JSON la plupart du temps.
// C’est une alternative plus simple et plus puissante que fetch() (intégré à JS).
// À quoi ça sert concrètement ?
// Consommer une API externe : Exemple : récupérer des hôtels, des vols ou des villes depuis l’API Amadeus
// Envoyer des données : envoyer un formulaire d’inscription ou de réservation vers ton serveur Node.js
// Communiquer entre ton front-end et ton back-end : par exemple, ton EJS (front) appelle ton Express (back) qui appelle une API externe.


require('dotenv').config({ path: __dirname + '/../../../.env' });
const axios = require('axios');

const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY;
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET;
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

let accessToken = null;
let tokenExpiresAt = null;

// Récupération du token
async function getAccessToken() {
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const response = await axios.post(
    `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: AMADEUS_API_KEY,
      client_secret: AMADEUS_API_SECRET
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  accessToken = response.data.access_token;
  tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
  console.log('✅ Nouveau token Amadeus généré');
  return accessToken;
}

// Requête générique vers Amadeus
async function amadeusRequest(endpoint, params = {}) {
  const token = await getAccessToken();
  const res = await axios.get(`${AMADEUS_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
}

module.exports = { amadeusRequest };
