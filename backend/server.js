require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
const PORT = process.env.PORT || 5000;
let db, gamesCollection;

MongoClient.connect(MONGODB_URI)
    .then(client => {
        console.log("✅ Connecté à MongoDB");
        db = client.db(DB_NAME);
        gamesCollection = db.collection(COLLECTION_NAME);

        app.listen(PORT, () => {
            console.log(`🚀 Serveur running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("❌ Erreur de connexion MongoDB :", error);
        process.exit(1);
    });

const validateGame = (game) => {
    const errors = [];
    if (!game.titre || typeof game.titre !== 'string' || game.titre.trim().length < 1) {
        errors.push("Le titre est requis.");
    }
    if (!game.genre || !Array.isArray(game.genre) || game.genre.length < 1) {
        errors.push("Au moins un genre est requis.");
    }
    if (!game.plateforme || !Array.isArray(game.plateforme) || game.plateforme.length < 1) {
        errors.push("Au moins une plateforme est requise.");
    }
    const currentYear = new Date().getFullYear();
    if (game.annee_sortie && (game.annee_sortie < 1970 || game.annee_sortie > currentYear)) {
        errors.push(`L'année doit être entre 1970 et ${currentYear}.`);
    }
    if (game.metacritic_score !== undefined && (game.metacritic_score < 0 || game.metacritic_score > 100)) {
        errors.push("Le score Metacritic doit être entre 0 et 100.");
    }
    return errors;
};

app.get('/api/games', async (req, res) => {
    try {
        if (!gamesCollection) return res.status(503).json({ error: "Base de données non prête" });

        const { genre, plateforme } = req.query;
        let query = {};
        if (genre) query.genre = genre;
        if (plateforme) query.plateforme = plateforme;

        const games = await gamesCollection.find(query).toArray();
        res.json(games);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

app.get('/api/games/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID invalide" });
        const game = await gamesCollection.findOne({ _id: new ObjectId(id) });
        if (!game) return res.status(404).json({ error: "Jeu non trouvé" });
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        if (!gamesCollection) return res.status(503).json({ error: "Base de données non prête" });

        const stats = await gamesCollection.aggregate([
            {
                $group: {
                    _id: null,
                    totalJeux: { $sum: 1 },
                    tempsJeuTotal: { $sum: "$temps_jeu_heures" },
                    scoreMoyen: { $avg: "$metacritic_score" }
                }
            }
        ]).toArray();
        res.json(stats[0] || { totalJeux: 0, tempsJeuTotal: 0, scoreMoyen: 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/games', async (req, res) => {
    try {
        const newGame = req.body;
        const validationErrors = validateGame(newGame);
        if (validationErrors.length > 0) return res.status(400).json({ errors: validationErrors });

        newGame.date_ajout = new Date();
        newGame.date_modification = new Date();
        newGame.termine = newGame.termine === true;

        const result = await gamesCollection.insertOne(newGame);
        res.status(201).json({ ...newGame, _id: result.insertedId });
    } catch (err) {
        console.error("ERREUR CRITIQUE LORS DE L'AJOUT :", err);
        res.status(500).json({ error: err.message || "Erreur inconnue" });
    }
});

app.put('/api/games/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID invalide" });

        const updates = req.body;
        delete updates._id;
        updates.date_modification = new Date();

        const result = await gamesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        if (result.matchedCount === 0) return res.status(404).json({ error: "Jeu non trouvé" });
        res.json({ message: "Mis à jour" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/games/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID invalide" });

        const result = await gamesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ error: "Jeu non trouvé" });
        res.json({ message: "Supprimé" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
