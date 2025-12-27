import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Copy, Users, Settings, UserMinus, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface Participant {
    user_id: string;
    username: string;
    avatar_url: string | null;
    role: string;
    joined_at: string;
}

interface Props {
    eventId: string;
}

export default function EventSettings({ eventId }: Props) {
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadSettings();
    }, [eventId]);

    async function loadSettings() {
        try {
            const user = await supabase.auth.getUser();
            setCurrentUser(user.data.user);

            // Fetch event details (code)
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('invite_code')
                .eq('id', eventId)
                .single();

            if (eventError) throw eventError;
            setInviteCode(event.invite_code);

            // Fetch participants
            const { data: parts, error: partsError } = await supabase
                .from('participants')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    profiles (username, avatar_url)
                `)
                .eq('event_id', eventId);

            if (partsError) throw partsError;

            // Map to flat structure
            const formattedParts = parts.map((p: any) => ({
                user_id: p.user_id,
                role: p.role,
                joined_at: p.joined_at,
                username: p.profiles?.username || 'Utente sconosciuto',
                avatar_url: p.profiles?.avatar_url
            }));

            setParticipants(formattedParts);

        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    }

    const copyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            alert('Codice copiato!');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Caricamento impostazioni...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* Invite Code Section */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Codice Invito
                </h3>
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <code className="text-2xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 flex-1 text-center">
                        {inviteCode}
                    </code>
                    <button
                        onClick={copyCode}
                        className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                        title="Copia codice"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Condividi questo codice con i tuoi amici per farli entrare nell'evento.
                </p>
            </div>

            {/* Participants List */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Partecipanti ({participants.length})
                </h3>

                <div className="space-y-3">
                    {participants.map((participant) => (
                        <div key={participant.user_id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                    {participant.avatar_url ? (
                                        <img src={participant.avatar_url} alt={participant.username} className="w-full h-full object-cover" />
                                    ) : (
                                        participant.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        {participant.username}
                                        {participant.user_id === currentUser?.id && (
                                            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">Io</span>
                                        )}
                                        {participant.role === 'admin' && (
                                            <span title="Admin"><Shield className="w-3 h-3 text-amber-500" /></span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Membro dal {new Date(participant.joined_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions (Future implementation) */}
                            {/* <button className="text-gray-300 hover:text-red-500 p-2">
                                <UserMinus className="w-4 h-4" />
                            </button> */}
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger Zone (Future) */}
            <div className="p-6 rounded-xl border border-red-100 bg-red-50/50 opacity-60">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Zona Pericolo</h3>
                <p className="text-xs text-red-600 mb-4">
                    Eliminare l'evento o abbandonarlo sono azioni irreversibili.
                </p>
                <button disabled className="text-xs bg-white border border-red-200 text-red-400 px-3 py-1.5 rounded cursor-not-allowed">
                    Abbandona Evento
                </button>
            </div>
        </div>
    );
}
