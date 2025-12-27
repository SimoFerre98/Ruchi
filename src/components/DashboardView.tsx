import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Grid, Calendar, LogOut, Search, User, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Event {
    id: string;
    title: string;
    invite_code: string;
    created_at: string;
}

export default function DashboardView() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [joinCode, setJoinCode] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        try {
            setError(null); // Clear any previous errors
            const user = await supabase.auth.getUser();
            if (!user.data.user) {
                // For demo purposes, if no user, maybe we prompt login or showed mocked data? 
                // But RLS requires auth. 
                // Let's assume for this step the user might need to be "logged in" anonymously or we handle it.
                // For now, let's try to fetch.
            }

            // We need to fetch events where user is creator or participant
            // Our RLS allows select if we are creator or participant.
            const { data, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setEvents(data || []);
        } catch (err: any) {
            console.error('Error fetching events:', err);
            setError(err.message || 'Errore di caricamento eventi');
        } finally {
            setLoading(false);
        }
    }

    async function createEvent(e: React.FormEvent) {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        setIsCreating(true);
        try {
            const user = await supabase.auth.getUser();
            let userId = user.data.user?.id;

            // Auto-signup/login for demo if not exists (This is a hack for the demo flow)
            // Ideally we have a proper Auth flow. 
            // If userId is missing, we can't create event with RLS properly unless we allow public creation.
            // Let's check if we have a session.
            if (!userId) {
                // Quick anon sign in for the demo to work immediately
                const { data, error } = await supabase.auth.signInAnonymously();
                if (error) throw error;
                userId = data.user?.id;
            }

            if (!userId) throw new Error("Utente non autenticato");

            // 1. Create Event
            const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                    title: newEventTitle,
                    created_by: userId,
                    invite_code: inviteCode
                })
                .select()
                .single();

            if (eventError) throw eventError;

            // 2. Add creator as admin participant
            const { error: partError } = await supabase
                .from('participants')
                .insert({
                    event_id: event.id,
                    user_id: userId,
                    role: 'admin'
                });

            if (partError) throw partError;

            // Refresh list
            await fetchEvents();
            setNewEventTitle('');
            // Optional: redirect immediately
            // window.location.href = `/event/${event.id}`;
        } catch (error: any) {
            console.error("Error creating event:", error);
            alert(`Errore creazione evento: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsCreating(false);
        }
    }

    async function handleJoinEvent(e: React.FormEvent) {
        e.preventDefault();
        if (!joinCode.trim()) return;

        try {
            const user = await supabase.auth.getUser();
            if (!user.data.user) throw new Error('Devi essere loggato');

            const { data: eventId, error } = await supabase
                .rpc('join_event_by_code', { _invite_code: joinCode });

            if (error) throw error;

            // Success
            window.location.href = `/event/${eventId}`;
        } catch (error: any) {
            console.error("Error joining event:", error);
            alert(`Errore: ${error.message}`);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/login';
    }

    if (loading) return (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p>Caricamento eventi...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:p-8 space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">I tuoi Eventi</h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">Gestisci le tue spese condivise</p>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto">
                    <a
                        href="/profile"
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
                        title="Il tuo profilo"
                    >
                        <User className="w-5 h-5" />
                    </a>
                    <div className="flex gap-2">
                        {isJoining ? (
                            <form onSubmit={handleJoinEvent} className="flex gap-2 animate-in fade-in slide-in-from-right-4 items-center">
                                <input
                                    type="text"
                                    placeholder="CODICE..."
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-24 md:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="bg-gray-900 dark:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-black dark:hover:bg-gray-600 transition text-sm font-medium whitespace-nowrap"
                                >
                                    Entra
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsJoining(false)}
                                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1"
                                >
                                    ✕
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsJoining(true)}
                                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 font-medium text-sm md:text-base shadow-sm"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Unisciti</span>
                                <span className="sm:hidden">Entra</span>
                            </button>
                        )}

                        {isCreating ? (
                            <form onSubmit={createEvent} className="flex gap-2 animate-in fade-in slide-in-from-right-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Nome..."
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="w-32 md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!newEventTitle.trim()}
                                    className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm whitespace-nowrap"
                                >
                                    Crea
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="text-gray-500 hover:text-gray-700 px-1"
                                >
                                    ✕
                                </button>
                            </form>
                        ) : (
                            !isJoining && (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm shadow-indigo-200 dark:shadow-none text-sm md:text-base"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Nuovo Evento</span>
                                    <span className="sm:hidden">Nuovo</span>
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            {error ? (
                <div className="p-8 md:p-12 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
                    <p className="font-bold">Errore di connessione</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs text-gray-500 mt-2">Controlla la console e il file .env</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {events.length === 0 ? (
                        <div className="col-span-full p-8 md:p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">Nessun evento presente</p>
                            <p className="text-sm">Creane uno nuovo per iniziare!</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <a
                                key={event.id}
                                href={`/event/${event.id}`}
                                className="group block p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                                        {event.invite_code}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{event.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Creato il {new Date(event.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                                    Gestisci <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
