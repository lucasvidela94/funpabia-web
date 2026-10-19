-- Fictional data for local development only. Never apply it with --remote.
--
--   pnpm exec wrangler d1 execute funpabia --local --file tools/dev-seed/seed.sql
--
-- Photos point at R2 keys under seed/. Upload any JPGs with those names to the local bucket
-- (pnpm exec wrangler r2 object put funpabia/seed/<name>.jpg --local --file <path>), plus a 480px
-- copy of each as seed/<name>-480.jpg (src/lib/photos: every photo has that thumbnail). Without
-- them the cards show the "Foto en camino" placeholder. Running the file again replaces the seed rows.

DELETE FROM raffle WHERE id LIKE 'seed-%';
DELETE FROM donation WHERE id LIKE 'seed-%';
DELETE FROM goal WHERE id LIKE 'seed-%';
DELETE FROM photo WHERE id LIKE 'seed-%';
DELETE FROM animal WHERE id LIKE 'seed-%';
DELETE FROM agenda_event WHERE id LIKE 'seed-%';
DELETE FROM lost_found_report WHERE id LIKE 'seed-%';
DELETE FROM setting WHERE key IN ('donation_accounts');

INSERT INTO animal (id, name, slug, species, sex, age_category, size, color, approx_breed, story, personality,
  good_with_dogs, good_with_cats, good_with_kids, neutered, vaccinated, dewormed, status, urgent, intake_date,
  intake_reason, current_location, published, special_requirements)
VALUES
  ('seed-lobito', 'Lobito', 'lobito-1234', 'dog', 'male', 'adult', 'large', 'Marrón y negro', 'Mestizo',
   'Lo encontramos en la ruta 22, flaco y con una pata lastimada. Hoy camina perfecto y es el primero en saludar cuando llega alguien al refugio.

Es tranquilo adentro de la casa y le encanta salir a caminar. Necesita una familia con paciencia para los primeros días.',
   '["Tranquilo","Cariñoso","Le gusta caminar"]', 'yes', 'unknown', 'yes', 1, 1, 1, 'available', 1, '2026-03-02',
   'rescue', 'shelter', 1, NULL),
  ('seed-toto', 'Toto', 'toto-2071', 'dog', 'male', 'adult', 'medium', 'Gris azulado', 'Mestizo de boyero',
   'Toto vivía atado en un patio. Llegó con miedo a la correa y hoy ya la pide para salir.', '["Inteligente","Activo"]',
   'yes', 'no', 'unknown', 1, 1, 1, 'available', 1, '2026-05-14', 'raid', 'foster', 1,
   'Necesita un patio cerrado alto: todavía intenta saltar.'),
  ('seed-negra', 'Negra', 'negra-3310', 'dog', 'female', 'adult', 'medium', 'Negra', NULL,
   'Es la más mimosa del refugio. Se lleva bien con todos los perros y busca upa aunque sea grande.',
   '["Mimosa","Sociable"]', 'yes', 'yes', 'yes', 1, 1, 1, 'available', 0, '2025-11-20', 'abandonment', 'shelter', 1, NULL),
  ('seed-chispa', 'Chispa', 'chispa-4482', 'dog', 'female', 'young', 'medium', 'Blanca y negra', NULL, NULL,
   '["Juguetona"]', 'yes', 'unknown', 'yes', 1, 1, 0, 'available', 0, '2026-08-01', 'surrender', 'foster', 1, NULL),
  ('seed-pelusa', 'Pelusa', 'pelusa-5109', 'dog', 'male', 'baby', 'small', 'Gris', NULL,
   'Tiene tres meses y es puro pelo. Va a ser mediano.', '["Curioso","Dormilón"]', 'yes', 'yes', 'yes', 0, 1, 1,
   'available', 0, '2026-09-10', 'rescue', 'foster', 1, NULL),
  ('seed-mora', 'Mora', 'mora-6620', 'dog', 'female', 'young', 'medium', 'Negra con blanco', NULL, NULL,
   '["Compañera"]', 'yes', 'unknown', 'yes', 1, 1, 1, 'reserved', 0, '2026-06-03', 'rescue', 'shelter', 1, NULL),
  ('seed-frida', 'Frida', 'frida-7015', 'dog', 'female', 'young', 'small', 'Negra con blanco', NULL, NULL,
   '["Coqueta","Alegre"]', 'yes', 'yes', 'yes', 1, 1, 1, 'available', 0, '2026-07-22', 'abandonment', 'foster', 1, NULL),
  ('seed-rulo', 'Rulo', 'rulo-7781', 'dog', 'male', 'baby', 'medium', 'Negro y fuego', NULL, NULL, '["Juguetón"]',
   'yes', 'yes', 'yes', 0, 1, 1, 'available', 0, '2026-09-28', 'rescue', 'foster', 1, NULL),
  ('seed-manchita', 'Manchita', 'manchita-8243', 'dog', 'female', 'adult', 'large', 'Negra y blanca', NULL, NULL,
   '["Guardiana","Leal"]', 'no', 'no', 'unknown', 1, 1, 1, 'available', 0, '2025-08-15', 'rescue', 'shelter', 1, NULL),
  ('seed-cafe', 'Café', 'cafe-8890', 'dog', 'male', 'senior', 'small', 'Marrón claro', 'Mestizo de yorkshire',
   'Tiene unos diez años y lo devolvieron porque la familia se mudó. Merece una vejez tranquila.',
   '["Tranquilo","Fiel"]', 'yes', 'yes', 'yes', 1, 1, 1, 'available', 0, '2025-06-01', 'surrender', 'shelter', 1, NULL),
  ('seed-tuna', 'Tuna', 'tuna-9152', 'cat', 'female', 'adult', 'small', 'Calicó', NULL, NULL, '["Independiente"]',
   'unknown', 'yes', 'yes', 1, 1, 1, 'available', 0, '2026-04-11', 'abandonment', 'foster', 1, NULL),
  ('seed-domingo', 'Domingo', 'domingo-9407', 'cat', 'male', 'young', 'small', 'Blanco y negro', NULL,
   'Apareció un domingo en la puerta de una voluntaria y de ahí el nombre.', '["Mimoso","Charlatán"]', 'unknown', 'yes',
   'yes', 1, 1, 1, 'available', 0, '2026-08-17', 'rescue', 'foster', 1, NULL),
  ('seed-betty', 'Betty', 'betty-1020', 'dog', 'female', 'adult', 'medium', 'Blanca y negra', NULL,
   'Betty encontró familia en septiembre. Gracias a todos los que compartieron su ficha.', '[]', 'yes', 'yes', 'yes',
   1, 1, 1, 'adopted', 0, '2026-02-01', 'rescue', 'shelter', 1, NULL);

INSERT INTO photo (id, animal_id, r2_key, position, alt_text, width, height, is_primary) VALUES
  ('seed-p-lobito', 'seed-lobito', 'seed/dog-10.jpg', 0, 'Lobito, perro marrón y negro, sentado en el campo al atardecer', 1200, 675, 1),
  ('seed-p-toto', 'seed-toto', 'seed/dog-5.jpg', 0, 'Toto, perro gris azulado, parado sobre un piso de baldosas', 665, 1182, 1),
  ('seed-p-negra', 'seed-negra', 'seed/dog-11.jpg', 0, 'Negra, perra negra con collar rojo, mirando hacia arriba', 900, 1200, 1),
  ('seed-p-chispa', 'seed-chispa', 'seed/dog-12.jpg', 0, 'Chispa, perra blanca y negra, sentada en el asiento de un auto', 1080, 1054, 1),
  ('seed-p-pelusa', 'seed-pelusa', 'seed/dog-1.jpg', 0, 'Pelusa, cachorro gris de pelo largo, sentado en un deck', 900, 1200, 1),
  ('seed-p-mora', 'seed-mora', 'seed/dog-6.jpg', 0, 'Mora, perra negra con pecho blanco, sentada sobre una manta', 900, 1200, 1),
  ('seed-p-frida', 'seed-frida', 'seed/dog-7.jpg', 0, 'Frida, perra chica negra y blanca, en un sillón', 900, 1200, 1),
  ('seed-p-rulo', 'seed-rulo', 'seed/dog-9.jpg', 0, 'Rulo, cachorro negro y fuego, echado sobre una alfombra', 1125, 967, 1),
  ('seed-p-manchita', 'seed-manchita', 'seed/dog-3.jpg', 0, 'Manchita, perra negra y blanca, sentada en un banco', 900, 1200, 1),
  ('seed-p-cafe', 'seed-cafe', 'seed/dog-4.jpg', 0, 'Café, perro chico marrón claro, parado sobre adoquines', 675, 1200, 1),
  ('seed-p-tuna', 'seed-tuna', 'seed/cat-1.jpg', 0, 'Tuna, gata calicó, panza arriba sobre una manta roja', 900, 1200, 1),
  ('seed-p-domingo', 'seed-domingo', 'seed/cat-3.jpg', 0, 'Domingo, gato blanco y negro, tapándose la cara con las patas', 900, 1190, 1),
  ('seed-p-betty', 'seed-betty', 'seed/dog-2.jpg', 0, 'Betty, perra blanca y negra, echada en el pasto', 757, 385, 1);

INSERT INTO goal (id, title, slug, description, target_amount, deadline_on, status, mercado_pago_url) VALUES
  ('seed-goal-vet', 'Deuda veterinaria de octubre', 'deuda-veterinaria-octubre',
   'Cirugías y tratamientos de los rescates de septiembre. Con esto la veterinaria sigue atendiendo sin cortar.',
   5000000, '2026-10-31', 'active', 'https://link.mercadopago.com.ar/ejemplo'),
  ('seed-goal-food', 'Alimento para el invierno', 'alimento-invierno',
   'Bolsas de alimento para los perros del refugio durante junio, julio y agosto.', 1800000, NULL, 'fulfilled', NULL);

INSERT INTO donation (id, goal_id, amount, donated_on, method, anonymous) VALUES
  ('seed-d1', 'seed-goal-vet', 1200000, '2026-10-02', 'alias', 1),
  ('seed-d2', 'seed-goal-vet', 650000, '2026-10-05', 'mp_link', 1),
  ('seed-d3', 'seed-goal-vet', 400000, '2026-10-08', 'cbu', 1),
  ('seed-d4', 'seed-goal-vet', 350000, '2026-10-11', 'alias', 1),
  ('seed-d5', 'seed-goal-vet', 280000, '2026-10-14', 'cash', 1),
  ('seed-d6', 'seed-goal-vet', 220000, '2026-10-16', 'mp_link', 1),
  ('seed-d7', 'seed-goal-food', 1800000, '2026-08-30', 'alias', 1);

-- A raffle mid-sale, 100 numbers, for the vet debt. Buyers are fictional.
INSERT INTO raffle (id, title, prizes, ticket_price, ticket_count, draw_on, draw_method, goal_id, status) VALUES
  ('seed-raffle', 'Rifa de primavera', 'Canasta de productos regionales
Bolsa de alimento de 15 kg
Corte y baño en Peluquería Patitas', 2000, 100, '2026-11-14', 'Quiniela Nocturna de Río Negro',
   'seed-goal-vet', 'selling');

INSERT INTO raffle_ticket (raffle_id, number, status, buyer_name, seller, payment_method, paid_on) VALUES
  ('seed-raffle', 3, 'paid', 'Marta', 'Nora', 'cash', '2026-10-10'),
  ('seed-raffle', 7, 'paid', 'Juan', 'Nora', 'alias', '2026-10-11'),
  ('seed-raffle', 12, 'reserved', 'Lucía', 'Caro', NULL, NULL),
  ('seed-raffle', 21, 'paid', NULL, 'Caro', 'cash', '2026-10-12'),
  ('seed-raffle', 33, 'paid', 'Roberto', 'Caro', 'mp_link', '2026-10-13'),
  ('seed-raffle', 47, 'reserved', NULL, 'Nora', NULL, NULL),
  ('seed-raffle', 58, 'paid', 'Sofía', NULL, 'alias', '2026-10-15'),
  ('seed-raffle', 90, 'paid', 'Ana', 'Nora', 'cash', '2026-10-16');

INSERT INTO agenda_event (id, type, title, starts_at, ends_at, venue_name, public_address, neighborhood, organizer,
  requirements, appointment_url) VALUES
  ('seed-e1', 'neutering', 'Castración gratuita de perros y gatos', '2026-10-24T12:00:00.000Z', '2026-10-24T16:00:00.000Z',
   'Club San Martín', NULL, 'Barrio Centro', 'municipality', 'Con turno previo. Ayuno de 12 horas. Mayores de 6 meses.',
   'https://example.com/turnos'),
  ('seed-e2', 'vaccination', 'Vacunación antirrábica', '2026-10-31T13:00:00.000Z', '2026-10-31T17:00:00.000Z',
   'Plaza Pichi Mahuida', NULL, 'Pichi Mahuida', 'zoonosis', 'Sin turno. Traé la libreta si la tenés.', NULL);

INSERT INTO lost_found_report (id, kind, species, sex, size, color, marks, event_on, description, zone_id,
  contact_name, contact_phone, status, expires_at, edit_token_hash, consent_at, consent_version) VALUES
  ('seed-r1', 'found', 'dog', 'male', 'medium', 'Marrón con manchas blancas', 'Collar rojo sin chapita', '2026-10-14',
   'Lo encontramos cerca de la ruta, muy dócil y con hambre. Lo tenemos en casa.', 'zone-cipolletti',
   'Marta (ejemplo)', '299 400 0001', 'active', '2026-12-31T00:00:00.000Z', 'seed', '2026-10-14T12:00:00.000Z', 'seed'),
  ('seed-r2', 'lost', 'cat', 'female', 'small', 'Gris atigrada', NULL, '2026-10-10',
   'Se escapó por el balcón. Es tímida y no se deja agarrar fácil.', 'zone-fernandez-oro',
   'Luis (ejemplo)', '299 400 0002', 'active', '2026-12-31T00:00:00.000Z', 'seed', '2026-10-10T12:00:00.000Z', 'seed'),
  ('seed-r3', 'found', 'cat', 'unknown', 'small', 'Negro', NULL, '2026-10-16',
   'Apareció en el patio. Esperando moderación.', 'zone-allen',
   'Ana (ejemplo)', '299 400 0003', 'pending', '2026-12-31T00:00:00.000Z', 'seed', '2026-10-16T12:00:00.000Z', 'seed');

INSERT INTO setting (key, value) VALUES
  ('donation_accounts', '[{"bank":"Mercado Pago","alias":"ejemplo.funpabia.mp"},{"bank":"Banco Patagonia","alias":"ejemplo.funpabia.bp","cbu":"0000000000000000000000"}]');
