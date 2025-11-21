import React, { useEffect, useState } from 'react';
import { Gamepad2, Trash2, Plus, Trophy, CheckCircle2, Circle, AlertCircle, X, Pencil, Save } from 'lucide-react';

interface Game {
    _id: string;
    titre: string;
    genre: string[];
    plateforme: string[];
    editeur?: string;
    annee_sortie?: number;
    metacritic_score?: number;
    termine: boolean;
}

interface Stats {
    totalJeux?: number;
    tempsJeuTotal?: number;
    scoreMoyen?: number;
}

interface GameFormData {
    titre: string;
    editeur: string;
    genre: string;
    plateforme: string;
    annee_sortie: string;
    metacritic_score: string;
    termine: boolean;
}

const API_BASE = "http://localhost:5000/api";

function App() {
    const [games, setGames] = useState<Game[]>([]);
    const [stats, setStats] = useState<Stats>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const initialFormState: GameFormData = {
        titre: '', editeur: '', genre: '', plateforme: '',
        annee_sortie: '', metacritic_score: '', termine: false
    };
    const [formData, setFormData] = useState<GameFormData>(initialFormState);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchGames(), fetchStats()]);
            setError(null);
        } catch {
            setError("Serveur indisponible. Vérifiez que le backend tourne sur le port 5000.");
        } finally {
            setLoading(false);
        }
    };

    const fetchGames = async () => {
        try {
            const res = await fetch(`${API_BASE}/games`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setGames(Array.isArray(data) ? data : []);
        } catch { setGames([]); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/stats`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStats(data);
        } catch { setStats({}); }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleStartEdit = (game: Game, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setError(null);
        setEditingId(game._id);
        setFormData({
            titre: game.titre,
            editeur: game.editeur || '',
            genre: game.genre.join(', '),
            plateforme: game.plateforme.join(', '),
            annee_sortie: game.annee_sortie ? game.annee_sortie.toString() : '',
            metacritic_score: game.metacritic_score ? game.metacritic_score.toString() : '',
            termine: game.termine
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const payload = {
            ...formData,
            genre: formData.genre.split(',').map(s => s.trim()).filter(s => s),
            plateforme: formData.plateforme.split(',').map(s => s.trim()).filter(s => s),
            annee_sortie: formData.annee_sortie ? Number(formData.annee_sortie) : undefined,
            metacritic_score: formData.metacritic_score ? Number(formData.metacritic_score) : undefined
        };

        try {
            let res;
            if (editingId) {
                res = await fetch(`${API_BASE}/games/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API_BASE}/games`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();

            if (!res.ok) {
                if (data.errors && Array.isArray(data.errors)) throw new Error(data.errors.join("\n"));
                if (data.error) throw new Error(data.error);
                throw new Error("Erreur inconnue.");
            }

            handleCancelEdit();
            fetchData();
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Voulez-vous vraiment supprimer ce jeu ?")) {
            try {
                await fetch(`${API_BASE}/games/${id}`, { method: 'DELETE' });
                if (editingId === id) handleCancelEdit();
                fetchData();
            } catch {
                alert("Erreur lors de la suppression");
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1d1d1f] font-sans selection:bg-blue-100 selection:text-blue-900">
            <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/70 backdrop-blur-xl">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                            <Gamepad2 size={20} />
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Arcade Manager</span>
                    </div>
                </div>
            </nav>

            {error && (
                <div className="mx-auto mt-6 max-w-6xl px-6">
                    <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 whitespace-pre-wrap">
                        <AlertCircle size={20} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-6xl px-6 py-10">
                {stats.totalJeux !== undefined && stats.totalJeux > 0 && (
                    <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[
                            { label: "Jeux", val: stats.totalJeux, icon: Gamepad2, suffix: "" },
                            { label: "Score Moyen", val: stats.scoreMoyen?.toFixed(0), icon: Trophy, suffix: "/100" }
                        ].map((stat, i) => (
                            <div key={i} className="rounded-3xl bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-400 mb-2 text-xs font-bold uppercase tracking-wider">
                                    <stat.icon size={16} /> {stat.label}
                                </div>
                                <div className="text-3xl font-bold text-gray-900">{stat.val}<span className="text-lg text-gray-400 ml-1 font-medium">{stat.suffix}</span></div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <div className={`sticky top-24 rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border transition-colors ${editingId ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingId ? 'Modifier le jeu' : 'Nouveau Jeu'}
                                </h2>
                                {editingId && (
                                    <button onClick={handleCancelEdit} className="text-xs font-medium text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                                        Annuler
                                    </button>
                                )}
                            </div>
                            <p className="mb-6 text-sm text-gray-500">
                                {editingId ? 'Modifiez les informations ci-dessous.' : 'Ajouter un titre à la collection.'}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {['titre', 'editeur', 'genre', 'plateforme'].map((field) => (
                                    <div key={field}>
                                        <input
                                            name={field}
                                            //@ts-ignore
                                            value={formData[field as keyof GameFormData]}
                                            onChange={handleInputChange}
                                            placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === 'genre' || field === 'plateforme' ? ' (séparés par virgule)' : '')}
                                            className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" name="annee_sortie" value={formData.annee_sortie} onChange={handleInputChange} placeholder="Année"
                                           className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"/>
                                    <input type="number" name="metacritic_score" value={formData.metacritic_score} onChange={handleInputChange} placeholder="Score (0-100)"
                                           className="w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"/>
                                </div>

                                <label className="flex cursor-pointer items-center justify-between rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-colors">
                                    <span className="text-sm font-medium text-gray-700">Jeu terminé ?</span>
                                    <div className="relative">
                                        <input type="checkbox" name="termine" checked={formData.termine} onChange={handleInputChange} className="peer sr-only" />
                                        <div className="h-6 w-11 rounded-full bg-gray-300 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full"></div>
                                    </div>
                                </label>

                                <button type="submit" className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 ${editingId ? 'bg-blue-700 shadow-blue-900/20' : 'bg-blue-600 shadow-blue-500/30 hover:bg-blue-700'}`}>
                                    {editingId ? <Save size={18} /> : <Plus size={18} />}
                                    {editingId ? 'Mettre à jour' : 'Ajouter'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <h2 className="mb-6 text-xl font-bold text-gray-900">Bibliothèque</h2>

                        {loading && <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div></div>}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {games.map((game) => (
                                <div
                                    key={game._id}
                                    onClick={() => setSelectedGame(game)}
                                    className={`group relative flex flex-col justify-between rounded-3xl bg-white p-5 shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer ${editingId === game._id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100'}`}
                                >
                                    <div className="mb-4">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-lg font-bold leading-tight text-gray-900 line-clamp-1" title={game.titre}>{game.titre}</h3>
                                            {game.metacritic_score && game.metacritic_score >= 90 && (
                                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">★ 90+</span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-gray-400 uppercase tracking-wide">{game.editeur} {game.annee_sortie && `• ${game.annee_sortie}`}</p>

                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {game.genre.map((g, i) => (
                                                <span key={i} className="rounded-md bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200">{g}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                                        <div className="flex items-center gap-3">
                                            {game.termine ? (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                    <CheckCircle2 size={12} /> Terminé
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                                    <Circle size={12} /> En cours
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => handleStartEdit(game, e)}
                                                className="rounded-full p-2 text-gray-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                title="Modifier"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(game._id); }}
                                                className="rounded-full p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!loading && games.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 py-20 text-center">
                                <Gamepad2 size={40} className="mb-3 text-gray-300" />
                                <p className="text-sm font-medium text-gray-500">Aucun jeu dans la collection</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {selectedGame && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setSelectedGame(null)}>
                    <div className="relative max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400">
                            <X size={24}/>
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedGame.titre}</h2>
                            <p className="text-base text-gray-500">{selectedGame.editeur} {selectedGame.annee_sortie && `• ${selectedGame.annee_sortie}`}</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Genres</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedGame.genre.map((g, i) => (
                                        <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">{g}</span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Plateformes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedGame.plateforme.map((p, i) => (
                                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">{p}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Metascore</h4>
                                    <span className="text-2xl font-bold text-gray-900">{selectedGame.metacritic_score || 'N/A'}</span>
                                </div>

                                <div className="text-right">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Statut</h4>
                                    {selectedGame.termine ? (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                            <CheckCircle2 size={16}/> Terminé
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                                            <Circle size={16}/> En cours
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={(e) => { setSelectedGame(null); handleStartEdit(selectedGame, e); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors"
                            >
                                <Pencil size={18} /> Modifier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
