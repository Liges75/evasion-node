
//Client Controller - Evasion

const { promisePool } = require('../config/db');


// Tableau de bord Client

exports.dashboard = async (req, res) => {
  try {
    const [reservations] = await promisePool.query(`
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

    res.render('client-dashboard', { 
      title: 'Mon compte Evasion',
      user: req.session.user,
      reservations,
      showSearchBar: false
    });

  } catch (err) {
    console.error('Erreur client-dashboard :', err);
    res.status(500).send('Erreur chargement du compte client.');
  }
};
