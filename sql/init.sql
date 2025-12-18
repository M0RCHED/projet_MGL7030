DROP TABLE IF EXISTS commandes;
DROP TABLE IF EXISTS cremes_glacees;
DROP TABLE IF EXISTS admins;

CREATE TABLE cremes_glacees (
                                id BIGSERIAL PRIMARY KEY,
                                nom TEXT NOT NULL
);

CREATE TABLE commandes (
                           id BIGSERIAL PRIMARY KEY,
                           date_heure TEXT NOT NULL,
                           format TEXT NOT NULL,
                           saveur TEXT NOT NULL
);

CREATE TABLE admins (
                        id BIGSERIAL PRIMARY KEY,
                        username TEXT UNIQUE,
                        password_hash TEXT,
                        google_id TEXT UNIQUE,
                        google_email TEXT UNIQUE
);

INSERT INTO cremes_glacees (nom) VALUES
                                     ('Chocolat'),
                                     ('Vanille'),
                                     ('Orange');
