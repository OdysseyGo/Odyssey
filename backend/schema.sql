-- Odyssey Seed Data
-- This file contains only seed data (INSERT statements)
-- Schema is managed by Django migrations

-- Create seed user
INSERT INTO "user" (
    password, last_login, is_superuser, username, first_name, last_name, 
    email, is_staff, is_active, date_joined, xp, follow_count, follower_count, 
    credit, level, country, user_type, tour_count, rating
) VALUES (
    '', NULL, false, 'seed_creator', 'Tour', 'Creator',
    'seed_creator@example.com', false, true, NOW(), 0, 0, 0,
    0, 1, '', 1, 0, 0.0
) ON CONFLICT (username) DO NOTHING;

-- Insert Tours (using subquery to get creator id)
INSERT INTO tours_tour (
    title, description, tour_type, category, difficulty, duration_minutes,
    is_premium, city, total_distance, walking_distance, transport_distance,
    elevation_gain, max_leg_distance, requires_transport, is_circular,
    metrics_calculated, accessibility_rating, status, created_at, updated_at, creator_id
) VALUES
('Historic Istanbul Walking Tour', 
 'Explore the rich history of Istanbul through its most iconic landmarks. This walking tour takes you through centuries of Byzantine and Ottoman heritage.',
 'PUZZLE', 'History', 'MEDIUM', 240, false, 'Istanbul',
 2156.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Eiffel Tower to Louvre',
 'A romantic walk through Paris, from the Eiffel Tower to the world-famous Louvre Museum.',
 'PUZZLE', 'Culture', 'EASY', 180, false, 'Paris',
 7854.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Colosseum Mystery Hunt',
 'Solve puzzles while exploring ancient Rome. Discover secrets of the Colosseum and Roman Forum.',
 'PUZZLE', 'Adventure', 'HARD', 210, false, 'Rome',
 2789.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Barcelona Gothic Quarter',
 'Wander through medieval streets and discover Gothic architecture in Barcelona''s oldest neighborhood.',
 'PUZZLE', 'Architecture', 'EASY', 150, false, 'Barcelona',
 512.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Amsterdam Canal Ring',
 'Cruise the famous canals and explore the UNESCO World Heritage canal district.',
 'PUZZLE', 'Culture', 'EASY', 120, false, 'Amsterdam',
 1456.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('London Royal Trail',
 'Visit the most iconic royal landmarks in London, from Buckingham Palace to the Tower of London.',
 'PUZZLE', 'History', 'MEDIUM', 270, false, 'London',
 4521.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Venice Hidden Gems',
 'Explore secret corners of Venice away from the tourist crowds.',
 'PUZZLE', 'Culture', 'MEDIUM', 180, false, 'Venice',
 1123.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Prague Castle Adventure',
 'Climb to Prague Castle and discover the heart of Czech history.',
 'PUZZLE', 'History', 'HARD', 200, false, 'Prague',
 987.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Berlin Wall Memorial Tour',
 'Follow the path of the Berlin Wall and learn about Germany''s divided past.',
 'PUZZLE', 'History', 'EASY', 150, false, 'Berlin',
 5678.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Vienna Classical Music Tour',
 'Experience Vienna through the lives and works of great composers.',
 'PUZZLE', 'Music', 'EASY', 165, false, 'Vienna',
 1234.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Lisbon Tram 28 Route',
 'Follow the iconic Tram 28 route through Lisbon''s historic neighborhoods.',
 'STORY', 'Culture', 'MEDIUM', 195, false, 'Lisbon',
 1567.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Athens Acropolis Walk',
 'Climb to the Acropolis and explore ancient Greek civilization.',
 'PUZZLE', 'History', 'HARD', 180, false, 'Athens',
 876.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Dublin Literary Pub Crawl',
 'Visit pubs frequented by famous Irish writers like Joyce and Wilde.',
 'HYBRID', 'Literature', 'EASY', 135, false, 'Dublin',
 654.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Copenhagen Hygge Experience',
 'Discover Danish hygge through cozy cafes, parks, and waterfronts.',
 'STORY', 'Culture', 'EASY', 140, false, 'Copenhagen',
 3456.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Edinburgh Castle to Arthur''s Seat',
 'Hike from Edinburgh Castle to the ancient volcano Arthur''s Seat.',
 'HYBRID', 'Nature', 'HARD', 240, false, 'Edinburgh',
 2987.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Brussels Chocolate Trail',
 'Sample the finest Belgian chocolates while touring Brussels landmarks.',
 'STORY', 'Food', 'EASY', 120, false, 'Brussels',
 789.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Stockholm Gamla Stan',
 'Explore Stockholm''s Old Town with its medieval alleyways and colorful buildings.',
 'STORY', 'History', 'EASY', 155, false, 'Stockholm',
 678.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Budapest Thermal Baths',
 'Visit historic thermal baths and learn about Budapest''s spa culture.',
 'STORY', 'Wellness', 'EASY', 160, false, 'Budapest',
 4123.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Krakow Medieval Quest',
 'Solve medieval puzzles while exploring Krakow''s historic market square.',
 'PUZZLE', 'Adventure', 'MEDIUM', 175, false, 'Krakow',
 1345.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator')),

('Porto Wine Cellars',
 'Tour the famous port wine cellars and taste Portugal''s finest wines.',
 'STORY', 'Food', 'EASY', 130, false, 'Porto',
 987.0, 0.0, 0.0, 0.0, 0.0, false, false, true, NULL, 'PUBLISHED', NOW(), NOW(),
 (SELECT id FROM "user" WHERE username = 'seed_creator'));

-- Insert Tour Steps
INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Hagia Sophia', 'A masterpiece of Byzantine architecture', 41.008580, 28.980180),
    (2, 'Blue Mosque', 'The iconic Sultan Ahmed Mosque', 41.005420, 28.976800),
    (3, 'Topkapi Palace', 'Former residence of Ottoman sultans', 41.011480, 28.983280),
    (4, 'Grand Bazaar', 'One of the oldest covered markets in the world', 41.010600, 28.968100)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Historic Istanbul Walking Tour';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Eiffel Tower', 'The iconic iron lattice tower', 48.858370, 2.294481),
    (2, 'Trocadero Gardens', 'Beautiful gardens with Eiffel Tower view', 48.862060, 2.287850),
    (3, 'Arc de Triomphe', 'Monumental arch honoring French soldiers', 48.873790, 2.295030),
    (4, 'Louvre Museum', 'The world''s largest art museum', 48.860610, 2.337644)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Eiffel Tower to Louvre';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Colosseum', 'Ancient amphitheater and puzzle location', 41.890210, 12.492231),
    (2, 'Roman Forum', 'Center of ancient Roman life', 41.892540, 12.485290),
    (3, 'Palatine Hill', 'Legendary founding place of Rome', 41.889020, 12.487140),
    (4, 'Trevi Fountain', 'Baroque fountain and wishing well', 41.900930, 12.483130)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Colosseum Mystery Hunt';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Barcelona Cathedral', 'Gothic cathedral in the heart of the quarter', 41.384030, 2.176090),
    (2, 'Placa Sant Jaume', 'Historic square and political center', 41.382730, 2.176560),
    (3, 'Carrer del Bisbe', 'Picturesque Gothic bridge street', 41.383640, 2.175930),
    (4, 'Placa Reial', 'Beautiful arcaded square', 41.380310, 2.175260)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Barcelona Gothic Quarter';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Anne Frank House', 'Historic house and museum', 52.375210, 4.883890),
    (2, 'Westerkerk', 'Protestant church with panoramic views', 52.374510, 4.883960),
    (3, 'Nine Streets', 'Charming shopping district', 52.371390, 4.886110),
    (4, 'Bloemenmarkt', 'Floating flower market', 52.367520, 4.891830)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Amsterdam Canal Ring';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Buckingham Palace', 'Official residence of the British monarch', 51.501480, -0.141880),
    (2, 'Westminster Abbey', 'Gothic church and coronation venue', 51.499420, -0.127380),
    (3, 'Big Ben', 'Iconic clock tower', 51.500729, -0.124625),
    (4, 'Tower Bridge', 'Famous bascule and suspension bridge', 51.505550, -0.075406),
    (5, 'Tower of London', 'Historic castle and Crown Jewels location', 51.508110, -0.076110)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'London Royal Trail';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Rialto Bridge', 'Famous bridge over the Grand Canal', 45.437980, 12.335880),
    (2, 'Campo Santa Maria Formosa', 'Charming Venetian square', 45.437450, 12.342260),
    (3, 'Libreria Acqua Alta', 'Unique bookstore with books in bathtubs', 45.440280, 12.342450),
    (4, 'St. Mark''s Square', 'Venice''s principal public square', 45.434160, 12.338090)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Venice Hidden Gems';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Charles Bridge', 'Medieval stone bridge', 50.086630, 14.411560),
    (2, 'Lesser Town Square', 'Historic square below the castle', 50.088010, 14.403800),
    (3, 'Prague Castle', 'Largest ancient castle complex', 50.090890, 14.400120),
    (4, 'St. Vitus Cathedral', 'Gothic masterpiece', 50.090720, 14.400280)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Prague Castle Adventure';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'East Side Gallery', 'Open-air gallery on Berlin Wall remains', 52.505180, 13.439550),
    (2, 'Berlin Wall Memorial', 'Official memorial site', 52.535150, 13.389640),
    (3, 'Brandenburg Gate', 'Iconic neoclassical monument', 52.516270, 13.377700),
    (4, 'Checkpoint Charlie', 'Famous Cold War crossing point', 52.507510, 13.390290)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Berlin Wall Memorial Tour';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Mozart''s House', 'Where Mozart composed The Marriage of Figaro', 48.210180, 16.374250),
    (2, 'St. Stephen''s Cathedral', 'Gothic cathedral where Mozart married', 48.208490, 16.373060),
    (3, 'Vienna State Opera', 'World-renowned opera house', 48.203040, 16.368930),
    (4, 'Beethoven Memorial', 'Monument to the great composer', 48.200170, 16.366890)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Vienna Classical Music Tour';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Graca Viewpoint', 'Panoramic view over Lisbon', 38.716950, -9.131120),
    (2, 'Alfama District', 'Oldest district with narrow streets', 38.713460, -9.130420),
    (3, 'Lisbon Cathedral', 'Oldest church in Lisbon', 38.709730, -9.132880),
    (4, 'Chiado Square', 'Cultural heart of Lisbon', 38.710820, -9.142150)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Lisbon Tram 28 Route';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Acropolis Entrance', 'Gateway to ancient history', 37.971530, 23.725780),
    (2, 'Parthenon', 'Temple dedicated to Athena', 37.971490, 23.726630),
    (3, 'Erechtheion', 'Temple with famous Caryatid statues', 37.972180, 23.726440),
    (4, 'Ancient Agora', 'Heart of ancient Athens', 37.975070, 23.722280)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Athens Acropolis Walk';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Trinity College', 'Home of the Book of Kells', 53.343810, -6.254220),
    (2, 'The Duke Pub', 'Favorite of literary legends', 53.343130, -6.259170),
    (3, 'Davy Byrnes', 'Featured in Joyce''s Ulysses', 53.342070, -6.259730),
    (4, 'Temple Bar', 'Cultural quarter with pubs', 53.345460, -6.264680)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Dublin Literary Pub Crawl';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Nyhavn', 'Colorful waterfront district', 55.679770, 12.591100),
    (2, 'The Little Mermaid', 'Iconic bronze statue', 55.692970, 12.599280),
    (3, 'Rosenborg Castle', 'Renaissance castle with gardens', 55.685870, 12.577530),
    (4, 'Tivoli Gardens', 'Historic amusement park', 55.673590, 12.568090)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Copenhagen Hygge Experience';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Edinburgh Castle', 'Historic fortress on Castle Rock', 55.948610, -3.199640),
    (2, 'Royal Mile', 'Historic street in Old Town', 55.950540, -3.188240),
    (3, 'Holyrood Palace', 'Official residence in Scotland', 55.952650, -3.172020),
    (4, 'Arthur''s Seat', 'Ancient volcano summit', 55.944320, -3.161820)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Edinburgh Castle to Arthur''s Seat';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Grand Place', 'Central square with guild houses', 50.846690, 4.352290),
    (2, 'Manneken Pis', 'Famous bronze fountain sculpture', 50.844980, 4.349950),
    (3, 'Galeries Royales', 'Elegant shopping arcades', 50.847620, 4.355150),
    (4, 'Sablon Square', 'Antiques and chocolate shops', 50.842310, 4.357950)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Brussels Chocolate Trail';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Royal Palace', 'Official residence of Swedish monarch', 59.326740, 18.071600),
    (2, 'Stortorget Square', 'Oldest square in Stockholm', 59.325690, 18.071360),
    (3, 'Nobel Museum', 'Museum about Nobel Prize', 59.325750, 18.071080),
    (4, 'Riddarholmen Church', 'Medieval church and royal burial site', 59.325350, 18.064450)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Stockholm Gamla Stan';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Szechenyi Baths', 'Largest thermal bath complex', 47.519330, 19.081530),
    (2, 'Heroes'' Square', 'Major city square', 47.514640, 19.077690),
    (3, 'St. Stephen''s Basilica', 'Neoclassical basilica', 47.501080, 19.053690),
    (4, 'Chain Bridge', 'Iconic suspension bridge', 47.499060, 19.043570)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Budapest Thermal Baths';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Main Market Square', 'Largest medieval square in Europe', 50.061730, 19.937260),
    (2, 'St. Mary''s Basilica', 'Gothic church with famous altarpiece', 50.061890, 19.939430),
    (3, 'Wawel Castle', 'Royal castle on hill', 50.054170, 19.935330),
    (4, 'Kazimierz District', 'Historic Jewish quarter', 50.051710, 19.946300)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Krakow Medieval Quest';

INSERT INTO tours_tourstep (tour_id, "order", title, description, latitude, longitude, image, audio)
SELECT t.id, s.order_num, s.title, s.description, s.lat, s.lon, '', ''
FROM tours_tour t
CROSS JOIN (VALUES
    (1, 'Ribeira Square', 'Historic riverside district', 41.140880, -8.613830),
    (2, 'Dom Luis I Bridge', 'Double-deck metal arch bridge', 41.140740, -8.610830),
    (3, 'Vila Nova de Gaia', 'Port wine cellar district', 41.135810, -8.613940),
    (4, 'Porto Cathedral', 'Romanesque cathedral', 41.143080, -8.611180)
) AS s(order_num, title, description, lat, lon)
WHERE t.title = 'Porto Wine Cellars';

-- Insert Puzzles for Tour Steps
-- Historic Istanbul Walking Tour Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'When was the Hagia Sophia originally built as a church?', 
     '["325 AD", "537 AD", "1453 AD", "1935 AD"]',
     '537 AD', 'It was commissioned by Emperor Justinian I.', 20),
    (2, 'How many minarets does the Blue Mosque have?', 
     '["4", "5", "6", "7"]',
     '6', 'It is unique among mosques for having this many minarets.', 15),
    (3, 'Which Ottoman Sultan built the Topkapi Palace?', 
     '["Suleiman the Magnificent", "Mehmed II", "Selim I", "Murad III"]',
     'Mehmed II', 'He conquered Constantinople in 1453.', 20),
    (4, 'How many covered streets does the Grand Bazaar have?', 
     '["41", "51", "61", "71"]',
     '61', 'It is one of the largest and oldest covered markets in the world.', 15)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Historic Istanbul Walking Tour' AND ts."order" = p.order_num;

-- Eiffel Tower to Louvre Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'In what year was the Eiffel Tower completed?', 
     '["1879", "1889", "1899", "1909"]',
     '1889', 'It was built for a World''s Fair celebrating a famous revolution.', 20),
    (2, 'What architectural style is the Trocadero Gardens known for?', 
     '["Art Deco", "Gothic", "Baroque", "Renaissance"]',
     'Art Deco', 'The gardens were redesigned for the 1937 World Fair.', 15),
    (3, 'How tall is the Arc de Triomphe?', 
     '["30 meters", "50 meters", "70 meters", "90 meters"]',
     '50 meters', 'It is one of the tallest triumphal arches in the world.', 15),
    (4, 'Which painting is the most famous artwork in the Louvre?', 
     '["The Starry Night", "The Scream", "Mona Lisa", "The Last Supper"]',
     'Mona Lisa', 'It was painted by Leonardo da Vinci.', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Eiffel Tower to Louvre' AND ts."order" = p.order_num;

-- Colosseum Mystery Hunt Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'What was the original name of the Colosseum?', 
     '["Flavian Amphitheatre", "Caesar Stadium", "Roman Arena", "Imperial Theater"]',
     'Flavian Amphitheatre', 'It was built by the Flavian dynasty.', 25),
    (2, 'How many spectators could the Roman Forum accommodate?', 
     '["It was not a stadium", "10,000", "50,000", "100,000"]',
     'It was not a stadium', 'The Forum was a marketplace and civic center.', 20),
    (3, 'According to legend, who founded Rome on Palatine Hill?', 
     '["Julius Caesar", "Augustus", "Romulus", "Nero"]',
     'Romulus', 'He and his twin brother were raised by a wolf.', 25),
    (4, 'What happens if you throw a coin into the Trevi Fountain?', 
     '["Good luck for a year", "Return to Rome", "Find true love", "Win money"]',
     'Return to Rome', 'Throw it with your right hand over your left shoulder.', 15)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Colosseum Mystery Hunt' AND ts."order" = p.order_num;

-- Barcelona Gothic Quarter Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'In which century was Barcelona Cathedral construction started?', 
     '["11th century", "13th century", "15th century", "17th century"]',
     '13th century', 'It was built on the site of an earlier Romanesque cathedral.', 15),
    (2, 'What government buildings are located in Placa Sant Jaume?', 
     '["City Hall and Generalitat", "Cathedral and Palace", "Museum and Library", "Parliament and Court"]',
     'City Hall and Generalitat', 'Both Catalan and Barcelona governments meet here.', 20),
    (3, 'What is the famous bridge on Carrer del Bisbe called?', 
     '["Pont dels Suspirs", "Pont Vell", "Pont Nou", "Pont Gothic"]',
     'Pont dels Suspirs', 'It means Bridge of Sighs in Catalan.', 15),
    (4, 'Who designed the lampposts in Placa Reial?', 
     '["Pablo Picasso", "Antoni Gaudi", "Salvador Dali", "Joan Miro"]',
     'Antoni Gaudi', 'This was one of his first public works in Barcelona.', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Barcelona Gothic Quarter' AND ts."order" = p.order_num;

-- Amsterdam Canal Ring Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'How many years did Anne Frank hide in the Secret Annex?', 
     '["1 year", "2 years", "3 years", "4 years"]',
     '2 years', 'She was hiding from July 1942 until August 1944.', 20),
    (2, 'How tall is the Westerkerk tower?', 
     '["65 meters", "75 meters", "85 meters", "95 meters"]',
     '85 meters', 'It is the highest church tower in Amsterdam.', 15),
    (3, 'What are the Nine Streets famous for?', 
     '["Museums", "Boutique shopping", "Restaurants only", "Historic monuments"]',
     'Boutique shopping', 'It features unique independent shops and cafes.', 15),
    (4, 'Why is the Bloemenmarkt called a floating market?', 
     '["It floats on boats", "Flowers float in water", "It moves around", "Its a nickname"]',
     'It floats on boats', 'The stalls are on houseboats moored on the canal.', 15)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Amsterdam Canal Ring' AND ts."order" = p.order_num;

-- London Royal Trail Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'How many rooms does Buckingham Palace have?', 
     '["375", "575", "775", "975"]',
     '775', 'It includes 52 royal and guest bedrooms.', 20),
    (2, 'How many coronations have taken place at Westminster Abbey?', 
     '["20", "30", "38", "40+"]',
     '40+', 'Starting with William the Conqueror in 1066.', 20),
    (3, 'Is Big Ben the name of the tower or the bell?', 
     '["The tower", "The bell", "Both", "Neither"]',
     'The bell', 'The tower is officially called Elizabeth Tower.', 15),
    (4, 'How old is Tower Bridge?', 
     '["About 130 years", "About 200 years", "About 300 years", "About 500 years"]',
     'About 130 years', 'It was completed in 1894.', 15),
    (5, 'What birds are kept at the Tower of London by tradition?', 
     '["Eagles", "Ravens", "Owls", "Falcons"]',
     'Ravens', 'Legend says if the ravens leave, the kingdom will fall.', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'London Royal Trail' AND ts."order" = p.order_num;

-- Venice Hidden Gems Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'When was the Rialto Bridge built?', 
     '["1391", "1491", "1591", "1691"]',
     '1591', 'It was the first permanent bridge across the Grand Canal.', 20),
    (2, 'What is Campo Santa Maria Formosa famous for?', 
     '["Its unusual shape", "A famous painting", "A royal palace", "A historic battle"]',
     'Its unusual shape', 'It is one of the largest campos in Venice.', 15),
    (3, 'Why does Libreria Acqua Alta store books in bathtubs?', 
     '["For decoration", "To protect from floods", "To save space", "For photography"]',
     'To protect from floods', 'Venice experiences frequent high water events called acqua alta.', 20),
    (4, 'How many bronze horses are on St. Marks Basilica?', 
     '["2", "4", "6", "8"]',
     '4', 'They are replicas; the originals are inside the basilica.', 15)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Venice Hidden Gems' AND ts."order" = p.order_num;

-- Prague Castle Adventure Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'How many statues are on the Charles Bridge?', 
     '["20", "30", "40", "50"]',
     '30', 'Most were installed between 1683 and 1714.', 20),
    (2, 'What is the name of the famous church in Lesser Town?', 
     '["St. Nicholas Church", "St. Peter Church", "St. Paul Church", "St. John Church"]',
     'St. Nicholas Church', 'It is one of the finest Baroque churches in Europe.', 15),
    (3, 'How large is Prague Castle according to Guinness World Records?', 
     '["Largest medieval castle", "Largest ancient castle", "Tallest castle", "Oldest castle"]',
     'Largest ancient castle', 'It covers nearly 70,000 square meters.', 25),
    (4, 'When was St. Vitus Cathedral finally completed?', 
     '["1429", "1729", "1929", "It is still incomplete"]',
     '1929', 'Construction started in 1344 and took nearly 600 years!', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Prague Castle Adventure' AND ts."order" = p.order_num;

-- Berlin Wall Memorial Tour Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'How long is the East Side Gallery?', 
     '["0.5 km", "1.3 km", "2.5 km", "5 km"]',
     '1.3 km', 'It is the longest remaining section of the Berlin Wall.', 15),
    (2, 'In what year did the Berlin Wall fall?', 
     '["1987", "1988", "1989", "1990"]',
     '1989', 'It fell on November 9th.', 20),
    (3, 'What style is the Brandenburg Gate?', 
     '["Baroque", "Neoclassical", "Gothic", "Art Nouveau"]',
     'Neoclassical', 'It was inspired by the gateway to the Acropolis in Athens.', 15),
    (4, 'What was Checkpoint Charlie?', 
     '["A museum", "A border crossing", "A restaurant", "A prison"]',
     'A border crossing', 'It was the best-known crossing point between East and West Berlin.', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Berlin Wall Memorial Tour' AND ts."order" = p.order_num;

-- Vienna Classical Music Tour Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'What opera did Mozart compose while living at Mozarts House?', 
     '["Don Giovanni", "The Magic Flute", "The Marriage of Figaro", "Cosi fan tutte"]',
     'The Marriage of Figaro', 'He lived here from 1784 to 1787.', 20),
    (2, 'What year did Mozart marry Constanze at St. Stephens?', 
     '["1780", "1782", "1784", "1786"]',
     '1782', 'The wedding took place at the cathedral on August 4th.', 15),
    (3, 'How many operas premiere at the Vienna State Opera each season?', 
     '["About 20", "About 35", "About 50", "About 75"]',
     'About 50', 'It is one of the busiest opera houses in the world.', 15),
    (4, 'Where was Beethoven born?', 
     '["Vienna", "Salzburg", "Bonn", "Munich"]',
     'Bonn', 'He moved to Vienna in 1792 to study with Haydn.', 20)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Vienna Classical Music Tour' AND ts."order" = p.order_num;

-- Athens Acropolis Walk Puzzles
INSERT INTO tours_puzzle (step_id, puzzle_type, question, options, correct_answer, hint, xp_reward)
SELECT ts.id, 'TRIVIA', p.question, p.options::jsonb, p.correct_answer, p.hint, p.xp
FROM tours_tourstep ts
JOIN tours_tour t ON ts.tour_id = t.id
CROSS JOIN (VALUES
    (1, 'What does Acropolis mean?', 
     '["Ancient city", "High city", "Holy city", "Sacred temple"]',
     'High city', 'It comes from the Greek words akron (highest point) and polis (city).', 15),
    (2, 'Who was the Parthenon dedicated to?', 
     '["Zeus", "Apollo", "Athena", "Poseidon"]',
     'Athena', 'She was the goddess of wisdom and the patron of Athens.', 20),
    (3, 'What are the female statues on the Erechtheion called?', 
     '["Maidens", "Caryatids", "Nymphs", "Muses"]',
     'Caryatids', 'They serve as architectural support columns.', 20),
    (4, 'What philosophical school was founded at the Ancient Agora?', 
     '["Epicureanism", "Cynicism", "Stoicism", "Platonism"]',
     'Stoicism', 'It was named after the Stoa Poikile (Painted Porch) there.', 25)
) AS p(order_num, question, options, correct_answer, hint, xp)
WHERE t.title = 'Athens Acropolis Walk' AND ts."order" = p.order_num;
