# Projet 03 – Base de données et Sécurité  
## Gestion de crèmerie – API REST

Ce projet est la continuité du Projet 02.  
Il ajoute la persistance des données avec PostgreSQL ainsi que des mécanismes de sécurité (authentification, autorisation, JWT, bcrypt et Google OAuth).

---

## Technologies utilisées
- Node.js
- Express
- PostgreSQL
- EJS
- bcrypt
- JSON Web Token (JWT)
- Passport (Google OAuth 2.0)
- Postman

---

## Structure du projet
```projet_MGL7030-main/
├─ index.js
├─ package.json
├─ views/
│  ├─ login.ejs
│  ├─ gestion.ejs
│  ├─ creme_ajout.ejs
│  └─ creme_supp.ejs
├─ public/
│  ├─ index.html
│  ├─ script.js
│  └─ stylesheet.css
├─ sql/
│  └─ init.sql
├─ scripts/
│  └─ add_admin.js
├─ README.md
└─ Projet03.postman_collection.json

```

---

## Initialisation de la base de données

Créer la base de données :
createdb cremerie

Initialiser les tables et les données :
psql -d cremerie -f sql/init.sql

Tables créées :
- cremes_glacees
- commandes
- admins

---

## Ajout d’un administrateur

Commande :
``` node scripts/add_admin.js <username> <password> [email_google] ```

Exemple :
``` node scripts/add_admin.js admin admin123 admin@gmail.com ```

Le mot de passe est stocké sous forme hachée avec bcrypt.

---

## Configuration des variables d’environnement

Créer un fichier .env à la racine du projet  :
```
PORT=3000
JWT_SECRET=change_me

PGHOST=localhost
PGPORT=5432
PGDATABASE=cremerie
PGUSER=postgres
PGPASSWORD=change_me

GOOGLE_CLIENT_ID=change_me
GOOGLE_CLIENT_SECRET=change_me
GOOGLE_CALLBACK_URL=http://localhost:3000/api/login/google/callback
```

---

## Lancement du serveur

```
npm install
npm start
```

Le serveur démarre sur :
http://localhost:3000

---

## Authentification

Connexion locale :
- URL : /api/login
- Nom d’utilisateur et mot de passe
- Mot de passe haché avec bcrypt
- JWT stocké dans un cookie HTTP-only

Connexion Google :
- Authentification via Google OAuth 2.0
- Réservée aux administrateurs existants
- Redirection vers /api/gestion après connexion

---

## Autorisation

Les routes suivantes sont protégées par JWT :
- /api/gestion
- /api/creme-glacees
- /api/creme-glacees/:id

Toute requête non authentifiée est redirigée vers /api/login.

---

## API REST

Crèmes glacées :
- GET /api/cremes-glacees
- POST /api/cremes-glacees
- DELETE /api/cremes-glacees/:id

Commandes :
- GET /api/commandes
- POST /api/commandes

Les échanges se font en JSON.

---

## Postman

Une collection Postman est fournie :

Projet03.postman_collection.json

Elle permet de tester toutes les routes de l’API REST.

---

## Backup de la base de données

```
pg_dump -d cremerie -f backup_cremerie.sql
```

---

## Sécurité
- Mots de passe hachés avec bcrypt
- Authentification JWT
- Cookies HTTP-only
- Routes d’administration protégées
- Authentification Google OAuth



