import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Moon, Sun, Monitor, User, Lock, Save, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

type Theme = 'light' | 'dark' | 'system';

export default function ProfileSettings() {
    const [theme, setTheme] = useState<Theme>('system');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Load initial theme
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) setTheme(savedTheme);

        loadProfile();
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
            localStorage.removeItem('theme');
        } else {
            root.classList.add(theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    async function loadProfile() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setUser(user);

            // Fetch profile data
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (profile) setFullName(profile.username || '');
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    async function updateProfile(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Update Username
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ username: fullName })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Update Password if provided
            if (password) {
                const { error: passError } = await supabase.auth.updateUser({ password });
                if (passError) throw passError;
            }

            setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
            setPassword(''); // Clear password field for security
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Errore durante l\'aggiornamento' });
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/login';
    }

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <ArrowLeft className="w-6 h-6" />
                    </a>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Il tuo Profilo</h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="hidden sm:inline">Esci</span>
                </button>
            </div>

            {/* Theme Section */}
            <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Aspetto
                </h2>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'light', icon: Sun, label: 'Chiaro' },
                        { id: 'dark', icon: Moon, label: 'Scuro' },
                        { id: 'system', icon: Monitor, label: 'Sistema' }
                    ].map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setTheme(opt.id as Theme)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                theme === opt.id
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-medium"
                                    : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <opt.icon className="w-6 h-6" />
                            <span className="text-sm">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Profile Form */}
            <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Dati Personali
                </h2>

                {message && (
                    <div className={cn(
                        "p-4 rounded-lg mb-6 flex items-center gap-2 text-sm",
                        message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                    )}>
                        <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                        {message.text}
                    </div>
                )}

                <form onSubmit={updateProfile} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome Utente
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Il tuo nome"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nuova Password <span className="text-gray-400 font-normal">(lascia vuoto per non cambiare)</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition flex items-center gap-2 font-medium disabled:opacity-70 ml-auto"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Salva Modifiche
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
