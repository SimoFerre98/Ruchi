import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Calendar, ArrowRight, Loader2 } from 'lucide-react';

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
    const [newEventTitle, setNewEventTitle] = useState('');

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

    return (
        <div>
            <header className="flex justify-between items-center mb-8 py-4 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-gray-900">I tuoi Eventi</h1>
                {/* Simple Inline Create Form for speed */}
                <form onSubmit={createEvent} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Nome nuovo evento..."
                        className="px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isCreating || !newEventTitle}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Crea
                    </button>
                </form>
            </header>

            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p>Caricamento eventi...</p>
                </div>
            ) : error ? (
                <div className="p-12 text-center text-red-500 bg-red-50 rounded-xl border border-red-100">
                    <p className="font-bold">Errore di connessione</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs text-gray-500 mt-2">Controlla la console e il file .env</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {events.length === 0 ? (
                        <div className="col-span-full p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Nessun evento presente</p>
                            <p className="text-sm">Creane uno nuovo per iniziare!</p>
                        </div>
                    ) : (
                        events.map(event => (
                            <a
                                key={event.id}
                                href={`/event/${event.id}`}
                                className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-indigo-500 hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        {event.invite_code}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Creato il {new Date(event.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center text-indigo-600 text-sm font-medium">
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
