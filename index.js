import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pg from "pg";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE || "cremerie",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "root"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const creerToken = (admin) =>
    jwt.sign({ adminId: admin.id, username: admin.username || null }, process.env.JWT_SECRET, { expiresIn: "2h" });

const auth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/api/login");
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.clearCookie("token");
        res.redirect("/api/login");
    }
};

let googleEnabled = false;

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
    googleEnabled = true;

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const googleId = profile.id;
                    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

                    const r = await pool.query(
                        "SELECT id, username, google_id FROM admins WHERE google_id = $1 OR (google_email IS NOT NULL AND google_email = $2) LIMIT 1",
                        [googleId, email]
                    );

                    if (r.rows.length === 0) return done(null, false);

                    if (!r.rows[0].google_id) {
                        await pool.query("UPDATE admins SET google_id = $1 WHERE id = $2", [googleId, r.rows[0].id]);
                    }

                    done(null, { id: r.rows[0].id, username: r.rows[0].username });
                } catch (e) {
                    done(e);
                }
            }
        )
    );
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/cremes-glacees", async (req, res) => {
    const r = await pool.query("SELECT id, nom FROM cremes_glacees ORDER BY id ASC");
    res.json(r.rows);
});

app.post("/api/cremes-glacees", async (req, res) => {
    const nom = req.body.nom;
    if (!nom || String(nom).trim() === "") return res.status(400).json({ message: "Le nom est requis" });
    const r = await pool.query("INSERT INTO cremes_glacees (nom) VALUES ($1) RETURNING id, nom", [String(nom).trim()]);
    res.status(201).json(r.rows[0]);
});

app.delete("/api/cremes-glacees/:id", async (req, res) => {
    const id = Number(req.params.id);
    const r = await pool.query("DELETE FROM cremes_glacees WHERE id = $1 RETURNING id", [id]);
    if (r.rows.length === 0) return res.status(404).json({ message: "Crème glacée non trouvée" });
    res.json({ message: "Crème glacée supprimée" });
});

app.get("/api/commandes", async (req, res) => {
    const r = await pool.query(
        'SELECT id, date_heure AS "dateHeure", format, saveur FROM commandes ORDER BY id DESC'
    );
    res.json(r.rows);
});

app.post("/api/commandes", async (req, res) => {
    const { format, saveur } = req.body;
    if (!format || !saveur) return res.status(400).json({ message: "format et saveur sont requis" });

    const date = new Date();
    const dd = date.toISOString().substring(0, 10);
    const h = date.getHours();
    const m = date.getMinutes();
    const hh = (h < 10 ? "0" : "") + h;
    const mm = (m < 10 ? "0" : "") + m;
    const dateHeure = `${dd} ${hh}:${mm}`;

    const r = await pool.query(
        'INSERT INTO commandes (date_heure, format, saveur) VALUES ($1, $2, $3) RETURNING id, date_heure AS "dateHeure", format, saveur',
        [dateHeure, format, saveur]
    );

    res.status(201).json(r.rows[0]);
});

app.get("/api/login", (req, res) => {
    res.render("login", { erreur: null, googleEnabled });
});

app.post("/api/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const r = await pool.query("SELECT id, username, password_hash FROM admins WHERE username = $1 LIMIT 1", [username]);

    if (r.rows.length === 0) return res.status(401).render("login", { erreur: "Identifiants invalides", googleEnabled });

    const ok = await bcrypt.compare(password, r.rows[0].password_hash || "");
    if (!ok) return res.status(401).render("login", { erreur: "Identifiants invalides", googleEnabled });

    const token = creerToken({ id: r.rows[0].id, username: r.rows[0].username });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.redirect("/api/gestion");
});

app.get("/api/login/google", (req, res, next) => {
    if (!googleEnabled) return res.redirect("/api/login");
    next();
}, passport.authenticate("google", { scope: ["profile", "email"], session: false }));

app.get("/api/login/google/callback", (req, res, next) => {
    if (!googleEnabled) return res.redirect("/api/login");
    next();
}, passport.authenticate("google", { session: false, failureRedirect: "/api/login" }), (req, res) => {
    const token = creerToken(req.user);
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    res.redirect("/api/gestion");
});

app.get("/api/gestion", auth, (req, res) => {
    res.render("gestion");
});

app.get("/api/creme-glacees", auth, (req, res) => {
    res.render("creme_ajout", { erreur: null });
});

app.post("/api/creme-glacees", auth, async (req, res) => {
    const nom = req.body.nom;
    if (!nom || String(nom).trim() === "") return res.status(400).render("creme_ajout", { erreur: "Le nom est requis" });
    await pool.query("INSERT INTO cremes_glacees (nom) VALUES ($1)", [String(nom).trim()]);
    res.redirect("/api/gestion");
});

app.get("/api/creme-glacees/:id", auth, (req, res) => {
    const id = Number(req.params.id) || 0;
    res.render("creme_supp", { id, erreur: null });
});

app.post("/api/creme-glacees/:id", auth, async (req, res) => {
    const id = Number(req.body.id || req.params.id);
    const r = await pool.query("DELETE FROM cremes_glacees WHERE id = $1 RETURNING id", [id]);
    if (r.rows.length === 0) return res.status(404).render("creme_supp", { id, erreur: "ID introuvable" });
    res.redirect("/api/gestion");
});



app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});

