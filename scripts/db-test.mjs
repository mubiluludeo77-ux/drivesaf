// Teste les migrations Supabase sans rien installer : PostgreSQL + PostGIS
// tournent dans Node grâce à PGlite. Lancer avec : npm run db:test
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { postgis } from '@electric-sql/pglite-postgis';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const migrationsDir = join(root, 'supabase', 'migrations');

const db = await PGlite.create({ extensions: { postgis } });

// ------------------------------------------------------------
// Ce que Supabase fournit déjà : schéma auth, rôles, droits par défaut
// ------------------------------------------------------------
await db.exec(`
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    phone text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  console.log(`✓ migration ${file}`);
}
await db.exec(`grant usage on schema extensions to anon, authenticated;`);
await db.exec(readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8'));
console.log('✓ seed.sql\n');

// ------------------------------------------------------------
// Outils de test
// ------------------------------------------------------------
let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? `  →  ${detail}` : ''}`);
  }
}

/** Exécute une requête en tant qu'utilisateur connecté (comme l'app avec Supabase). */
async function as(userId, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId ?? '']);
    await tx.exec(`set local role ${userId ? 'authenticated' : 'anon'}`);
    await tx.exec(`set local search_path = public, extensions`);
    return tx.query(sql, params);
  });
}

async function fails(name, userId, sql, params, expected) {
  try {
    await as(userId, sql, params);
    check(name, false, 'aucune erreur alors qu’une erreur était attendue');
  } catch (e) {
    check(name, !expected || e.message.includes(expected), e.message);
  }
}

async function newUser(name, phone) {
  const { rows } = await db.query(
    `insert into auth.users (phone, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id`,
    [phone, name]
  );
  return rows[0].id;
}

// Points de test (centres des secteurs)
const BYWARD = [-75.693, 45.426];
const AYLMER = [-75.84, 45.395];
const TORONTO = [-79.383, 43.653];

const requestRide = (fuel, from = BYWARD, to = AYLMER, toSector = 'aylmer') =>
  `select * from request_ride($1, '55, rue York', 'byward', ${from[0]}, ${from[1]},
     '120, rue Principale', '${toSector}', ${to[0]}, ${to[1]}, ${fuel}, 'Fatigue')`;

// ------------------------------------------------------------
// Scénarios
// ------------------------------------------------------------
console.log('Comptes et profils');
const alice = await newUser('Alice Client', '+16135550001');
const bob = await newUser('Bob Client', '+16135550002');
const karim = await newUser('Karim Chauffeur', '+18195550003');
const admin = await newUser('Admin', '+16135550004');
await db.query(`update profiles set role = 'admin' where id = $1`, [admin]);

const prof = await as(alice, `select full_name, role from profiles where id = $1`, [alice]);
check('profil créé automatiquement à l’inscription', prof.rows[0]?.full_name === 'Alice Client');
await fails('un client ne peut pas se donner le rôle admin', alice,
  `update profiles set role = 'admin' where id = $1`, [alice], 'permission denied');
const others = await as(alice, `select count(*)::int as n from profiles`);
check('un client ne voit que son propre profil', others.rows[0].n === 1, `voit ${others.rows[0].n}`);

console.log('\nSecteurs');
const sectors = await as(null, `select count(*)::int as n from service_sectors`);
check('15 secteurs lisibles sans être connecté', sectors.rows[0].n === 15);

console.log('\nPrix (identiques au prototype)');
const day = await as(null, `select * from fare_quote(16, 'ON', '2026-11-18 14:00 America/Toronto')`);
check('Centre-ville → Aylmer le jour : 58,60 $ + TVH 7,62 $ = 66,22 $',
  day.rows[0].price === '58.60' && day.rows[0].tax_amount === '7.62' && day.rows[0].total === '66.22',
  JSON.stringify(day.rows[0]));
check('part du chauffeur : 46,88 $', day.rows[0].driver_payout === '46.88');
const night = await as(null, `select * from fare_quote(16, 'ON', '2026-11-18 23:30 America/Toronto')`);
check('tarif de nuit +20 % : 70,32 $ avant taxes', night.rows[0].price === '70.32', night.rows[0].price);
const qc = await as(null, `select * from fare_quote(4, 'QC', '2026-11-18 14:00 America/Toronto')`);
check('départ à Gatineau : TPS + TVQ 14,975 % (33,40 $ → 5,00 $)',
  qc.rows[0].tax_label === 'TPS + TVQ 14,975 %' && qc.rows[0].tax_amount === '5.00', JSON.stringify(qc.rows[0]));

console.log('\nVoitures');
const car = await as(alice,
  `insert into vehicles (owner_id, make_model, plate, gearbox, province) values ($1, 'Honda Civic', 'ABCD 123', 'auto', 'ON') returning id`,
  [alice]);
const carId = car.rows[0].id;
check('le client enregistre sa voiture', Boolean(carId));
const bobCars = await as(bob, `select count(*)::int as n from vehicles`);
check('un autre client ne voit pas cette voiture', bobCars.rows[0].n === 0);
await fails('impossible d’enregistrer une voiture au nom de quelqu’un d’autre', bob,
  `insert into vehicles (owner_id, make_model, plate, province) values ($1, 'Kia', 'ZZZ 999', 'ON')`, [alice],
  'row-level security');

console.log('\nChauffeurs');
await fails('un permis G1 est refusé', karim,
  `insert into drivers (id, licence_class, licence_province, licence_expires) values ($1, 'G1', 'ON', '2030-01-01')`,
  [karim], 'invalid input value');
await fails('un permis du Québec ne peut pas être déclaré « G2 »', karim,
  `insert into drivers (id, licence_class, licence_province, licence_expires) values ($1, 'G2', 'QC', '2030-01-01')`,
  [karim], 'licence_matches_province');
await fails('un chauffeur ne peut pas s’auto-approuver', karim,
  `insert into drivers (id, licence_class, licence_province, licence_expires, status) values ($1, 'QCP', 'QC', '2030-01-01', 'approved')`,
  [karim], 'row-level security');
await as(karim,
  `insert into drivers (id, licence_class, licence_province, licence_expires) values ($1, 'QCP', 'QC', '2030-01-01')`,
  [karim]);
check('inscription chauffeur (classe 5 probatoire) en attente', true);
await fails('pas en ligne tant que le compte n’est pas approuvé', karim,
  `select set_driver_online(true, ${BYWARD[0]}, ${BYWARD[1]})`, [], 'pas encore approuvé');
await fails('un client ne peut pas approuver un chauffeur', alice,
  `select set_driver_status($1, 'approved')`, [karim], 'administrateurs');
await as(admin, `select set_driver_status($1, 'approved')`, [karim]);
await as(karim, `select set_driver_online(true, ${BYWARD[0]} + 0.004, ${BYWARD[1]})`);
const near = await as(alice, `select * from nearest_drivers(${BYWARD[0]}, ${BYWARD[1]})`);
check('PostGIS : chauffeur le plus proche trouvé (≈ 300 m)',
  near.rows[0]?.driver_id === karim && near.rows[0].distance_m > 250 && near.rows[0].distance_m < 400,
  JSON.stringify(near.rows));

console.log('\nCommande');
await fails('commande refusée en réserve (sous 1/4)', alice, requestRide(0.1), [carId], 'Carburant insuffisant');
await fails('commande refusée hors de la zone (Toronto)', alice, requestRide(0.5, BYWARD, TORONTO), [carId], 'hors de la zone');
await fails('commande refusée avec la voiture d’un autre', bob, requestRide(0.5), [carId], 'Voiture introuvable');
await fails('écriture directe dans rides interdite (prix falsifié)', alice,
  `insert into rides (client_id, vehicle_id, pickup_address, pickup_sector, pickup_point, dest_address, dest_sector, dest_point,
     fuel_level, distance_km, price, tax_label, tax_amount, total, driver_payout)
   values ($1, $2, 'a', 'byward', 'SRID=4326;POINT(-75.693 45.426)', 'b', 'aylmer', 'SRID=4326;POINT(-75.84 45.395)',
     0.5, 16, 1, 'x', 0, 1, 0)`, [alice, carId], 'row-level security');
const ride = (await as(alice, requestRide(0.5), [carId])).rows[0];
check('course créée : 16 km calculés par le serveur', ride?.distance_km === '16.00' && ride.status === 'searching',
  JSON.stringify({ km: ride?.distance_km, status: ride?.status }));
const quote = (await as(null, `select * from fare_quote(16, 'ON', $1)`, [ride.created_at])).rows[0];
check('prix enregistré = prix du serveur', ride.total === quote.total, `${ride.total} / ${quote.total}`);
await fails('une seule course active par client', alice, requestRide(0.5), [carId], 'rides_one_active_per_client');

console.log('\nConfidentialité de la course');
const bobRides = await as(bob, `select count(*)::int as n from rides`);
check('un autre client ne voit pas la course', bobRides.rows[0].n === 0);
const open = await as(karim, `select count(*)::int as n from rides where status = 'searching'`);
check('le chauffeur en ligne voit la demande', open.rows[0].n === 1);
const karimPin = await as(karim, `select count(*)::int as n from ride_secrets`);
check('le chauffeur ne peut PAS lire le code de sécurité', karimPin.rows[0].n === 0);
const pin = (await as(alice, `select pin from ride_secrets where ride_id = $1`, [ride.id])).rows[0]?.pin;
check('le client lit son code', /^\d{4}$/.test(pin ?? ''));

console.log('\nDéroulement');
await fails('un client ne peut pas accepter une course', bob, `select accept_ride($1)`, [ride.id], 'chauffeur approuvé');
await as(karim, `select accept_ride($1)`, [ride.id]);
const seenCar = await as(karim, `select make_model from vehicles where id = $1`, [carId]);
check('le chauffeur voit la voiture de sa course', seenCar.rows[0]?.make_model === 'Honda Civic');
const driverName = await as(alice, `select full_name from profiles where id = $1`, [karim]);
check('le client voit le nom de son chauffeur', driverName.rows[0]?.full_name === 'Karim Chauffeur');
await fails('impossible de démarrer avant d’être arrivé', karim,
  `select start_ride($1, $2, true)`, [ride.id, pin], 'Étape impossible');
await as(karim, `select mark_arrived($1)`, [ride.id]);
await fails('démarrage refusé sans vérifier la jauge', karim,
  `select start_ride($1, $2, false)`, [ride.id, pin], 'jauge');
const wrongPin = pin === '0000' ? '1111' : '0000';
const wrong = await as(karim, `select start_ride($1, $2, true) as r`, [ride.id, wrongPin]);
check('mauvais code → refusé', wrong.rows[0].r === 'wrong_pin', wrong.rows[0].r);
const good = await as(karim, `select start_ride($1, $2, true) as r`, [ride.id, pin]);
check('bon code + jauge vérifiée → course démarrée', good.rows[0].r === 'ok', good.rows[0].r);
await fails('un client ne peut pas annuler une course en cours', alice,
  `select cancel_ride($1)`, [ride.id], 'Annulation impossible');
await as(karim, `select mark_dropoff($1)`, [ride.id]);
await as(karim, `select finish_ride($1)`, [ride.id]);
const events = await as(alice, `select string_agg(status::text, ' → ' order by id) as s from ride_events where ride_id = $1`, [ride.id]);
check('historique complet enregistré', events.rows[0].s === 'searching → enroute → arrived → trip → dropoff → done',
  events.rows[0].s);

console.log('\nNotes');
await fails('un inconnu ne peut pas noter la course', bob, `select rate_ride($1, 1::smallint)`, [ride.id], 'pas votre course');
await as(alice, `select rate_ride($1, 4::smallint, 'Très bien')`, [ride.id]);
const avg = await as(karim, `select rating_avg from drivers where id = $1`, [karim]);
check('moyenne du chauffeur mise à jour (4,00)', avg.rows[0].rating_avg === '4.00', avg.rows[0].rating_avg);

console.log('\nFonctions internes');
await fails('ride_transition n’est pas appelable depuis l’app', alice,
  `select ride_transition($1, 'done', 'searching')`, [ride.id], 'permission denied');

console.log(`\n${passed} réussi(s), ${failed} échoué(s)`);
await db.close();
process.exit(failed ? 1 : 0);
