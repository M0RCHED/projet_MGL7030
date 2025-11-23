// index.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let cremesGlacees = [
  { id: 1, nom: "Chocolat" },
  { id: 2, nom: "Vanille" },
  { id: 3, nom: "Orange" }
];

let commandes = [];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/cremes-glacees", (req, res) => {
  res.json(cremesGlacees);
});

app.post("/api/cremes-glacees", (req, res) => {
  const { nom } = req.body;
  if (!nom || nom.trim() === "") {
    return res.status(400).json({ message: "Le nom est requis" });
  }
  const nouvelle = { id: Date.now(), nom: nom.trim() };
  cremesGlacees.push(nouvelle);
  res.status(201).json(nouvelle);
});

app.delete("/api/cremes-glacees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const existe = cremesGlacees.find(c => c.id === id);
  if (!existe) {
    return res.status(404).json({ message: "Crème glacée non trouvée" });
  }
  cremesGlacees = cremesGlacees.filter(c => c.id !== id);
  res.json({ message: "Crème glacée supprimée" });
});

app.get("/api/commandes", (req, res) => {
  res.json(commandes);
});

app.post("/api/commandes", (req, res) => {
  const { format, saveur } = req.body;
  if (!format || !saveur) {
    return res.status(400).json({ message: "format et saveur sont requis" });
  }

  const date = new Date();
  const dd = date.toISOString().substring(0, 10);
  const h = date.getHours();
  const m = date.getMinutes();
  const hh = (h < 10 ? "0" : "") + h;
  const mm = (m < 10 ? "0" : "") + m;
  const dateHeure = `${dd} ${hh}:${mm}`;

  const commande = {
    id: Date.now(),
    dateHeure,
    format,
    saveur
  };

  commandes.unshift(commande);
  res.status(201).json(commande);
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
