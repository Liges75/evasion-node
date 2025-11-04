
// Contrôleur Amadeus - pour récupere les paramètres de recherche (destinations, dates, nbre de personnes) 
// appeler l'API AMdeus (hotel + vol)
// calcul du tarif par personnes et afficher les infos dans la page de resultat de recherche.

// Axios est une bibliothèque JavaScript qui permet de faire des requêtes HTTP (GET, POST, PUT, DELETE…) vers une API pour envoyer ou récupérer des données, en JSON la plupart du temps.
// C’est une alternative plus simple et plus puissante que fetch() (intégré à JS).


require('dotenv').config({ path: __dirname + '/../../../.env' });
const axios = require('axios');

const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const UNSPLASH_URL = 'https://api.unsplash.com/search/photos';
let accessToken = null;

// Dictionnaire nom → code IATA / AMADEUS
const cityToIATACode = {
  paris: "PAR", tokyo: "TYO", londres: "LON", london: "LON",
  newyork: "NYC", "new york": "NYC", rome: "ROM", madrid: "MAD",
  berlin: "BER", lisbonne: "LIS", barcelone: "BCN", dubai: "DXB",
  nice: "NCE", amsterdam: "AMS", lisbon: "LIS", vienna: "VIE",
  bruxelles: "BRU", geneve: "GVA"
};

// ---------------- TOKEN AMADEUS ----------------
async function getAccessToken() {
  if (accessToken) return accessToken;
  const res = await axios.post(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_API_KEY,
      client_secret: process.env.AMADEUS_API_SECRET
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  accessToken = res.data.access_token;
  return accessToken;
}

// ---------------- CODE IATA ----------------
async function getCityCode(cityName) {
  try {
    const token = await getAccessToken();
    const res = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { keyword: cityName, subType: 'CITY', 'page[limit]': 1 }
    });
    if (!res.data.data.length) return null;
    return res.data.data[0].iataCode;
  } catch {
    return null;
  }
}

// ---------------- PHOTOS AMADEUS ----------------
async function getHotelPhotos(hotelIds, token) {
  try {
    const res = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/photos`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { hotelIds: hotelIds.join(',') }
    });
    const photosByHotel = {};
    for (const photo of res.data.data) {
      const id = photo.hotelId;
      if (!photosByHotel[id]) photosByHotel[id] = [];
      if (["EXTERIOR", "ROOM", "RESTAURANT"].includes(photo.category)) {
        photosByHotel[id].push(photo.url.replace('_L', '_S'));
      }
    }
    return photosByHotel;
  } catch (err) {
    console.warn('Photos Amadeus non disponibles -> fallback Unsplash');
    return {};
  }
}

// ---------------- BACK UP UNSPLASH ----------------
async function getUnsplashImage(query) {
  try {
    const res = await axios.get(UNSPLASH_URL, {
      params: {
        query,
        orientation: 'landscape',
        per_page: 1,
        client_id: process.env.UNSPLASH_ACCESS_KEY
      }
    });
    if (res.data.results.length > 0) {
      return res.data.results[0].urls.regular;
    }
  } catch (err) {
    console.error('Erreur Unsplash :', err.message);
  }
  return '/images/hotel-default.jpg';
}

// ---------------- MAIN SEARCH ----------------
exports.search = async (req, res) => {
  let { city, checkIn, checkOut, guests } = req.query;
  if (!city || !checkIn || !checkOut || !guests)
    return res.status(400).send('Paramètres manquants.');

  try {
    const token = await getAccessToken();
    const cleanCity = city.trim().toLowerCase();
    let cityCode = cityToIATACode[cleanCity] || await getCityCode(cleanCity);
    if (!cityCode) return res.status(404).send('Ville introuvable.');

    console.log(`Recherche hôtels pour ${city} (${cityCode})`);

    const hotelsRes = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { cityCode, radius: 10 }
    });

    const hotels = hotelsRes.data.data.slice(0, 12);
    const hotelIds = hotels.map(h => h.hotelId);
    const photos = await getHotelPhotos(hotelIds, token);

    const flightRes = await axios.get(`${AMADEUS_BASE_URL}/v2/shopping/flight-offers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: 'CDG',
        destinationLocationCode: cityCode,
        departureDate: checkIn,
        returnDate: checkOut,
        adults: guests,
        max: 1
      }
    });

    const flightOffer = flightRes.data.data[0];
    const prixVol = flightOffer ? parseFloat(flightOffer.price.total) : 190;

    const nbNuits = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const pensionJour = 30;

    // Génération des hôtels avec tarif et image
    const hotelsAvecTarif = await Promise.all(hotels.map(async (h) => {
      const prixNuit = 90;
      const totalHotel = prixNuit * nbNuits;
      const totalPension = pensionJour * nbNuits;
      const totalParPers = ((totalHotel + totalPension + prixVol) / guests).toFixed(2);

      const nbEtoiles = h.rating ? parseInt(h.rating) : 0;
      const etoiles = nbEtoiles ? "★".repeat(nbEtoiles) + "☆".repeat(5 - nbEtoiles) : "Non classé";

      // Image via Amadeus ou Unsplash
      const image = photos[h.hotelId]?.[0] || await getUnsplashImage(`${h.name} ${city}`);

      return {
        id: h.hotelId,
        nom: h.name,
        adresse: h.address?.lines?.[0] || 'Adresse non disponible',
        rating: etoiles,
        tarifToutInclus: totalParPers,
        nbNuits,
        prixVol,
        image
      };
    }));

    res.render('search-results', {
      title: `Séjours à ${city}`,
      city,
      hotels: hotelsAvecTarif,
      checkIn,
      checkOut,
      guests,
      showSearchBar: false
    });

  } catch (err) {
    console.error('Erreur Amadeus :', err.response?.data || err.message);
    res.status(500).send('Erreur recherche Amadeus');
  }
};
