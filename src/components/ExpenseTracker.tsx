import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { minimizeDebts, cn } from '../lib/utils';
import { Plus, Wallet, ArrowRight, ShoppingBag, Check, Loader2 } from 'lucide-react';

interface Expense {
    id: string;
    amount: number;
    description: string;
    payer_id: string;
    created_at: string;
}

interface Split {
    debtor_id: string;
    share_amount: number;
}

interface Participant {
    user_id: string;
    username: string; // Joined from profiles
}

interface ShoppingItem {
    id: string;
    item_name: string;
    quantity: string | null;
    is_bought: boolean;
    expense_id: string | null;
}

interface Props {
    eventId: string;
}

export default function ExpenseTracker({ eventId }: Props) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [simplifiedDebts, setSimplifiedDebts] = useState<{ from: string; to: string; amount: number }[]>([]);

    // Linking items
    const [pendingItems, setPendingItems] = useState<ShoppingItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [eventId]);

    async function loadData() {
        try {
            // Fetch participants with profiles
            const { data: participantsData, error: partError } = await supabase
                .from('participants')
                .select('user_id, profiles(username)')
                .eq('event_id', eventId);

            if (partError) throw partError;

            const parts = participantsData?.map(p => ({
                user_id: p.user_id,
                username: (p.profiles as any)?.username || 'Unknown'
            })) || [];
            setParticipants(parts);

            // Fetch expenses (simplified, ideally join splits)
            const { data: expensesData, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (expError) throw expError;
            setExpenses(expensesData || []);

            // Fetch pending shopping items (bought but not linked)
            const { data: pendingData, error: pendingError } = await supabase
                .from('shopping_items')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_bought', true)
                .is('expense_id', null);

            if (pendingError) console.error("Error fetching pending items:", pendingError);
            setPendingItems(pendingData || []);

            // Calculate balances
            // Need splits. For now, assuming EQUAL split among all for simplicity if splits table is complex to join in one go without types.
            // Let's fetch splits separately or assume a simple model for this MVP step.
            // To do it right: fetch expenses with splits.

            // Let's implement calculateBalances properly later. 
            // For now, fetching expenses is good.
            // I will implement a basic "Split Equally" logic on client side for the Demo.

        } catch (error) {
            console.error("Error loading expense data:", error);
        } finally {
            setLoading(false);
        }
    }

    async function calculateBalances() {
        // Mock implementation until we have full splits fetching
        // iterate expenses, add to payer, subtract from splitters
    }

    async function addExpense(e: React.FormEvent) {
        e.preventDefault();
        if (!amount || !description) return;

        try {
            const user = await supabase.auth.getUser();
            const payerId = user.data.user?.id;

            if (!payerId) {
                alert('Devi essere loggato');
                return;
            }

            const { data: expense, error } = await supabase.from('expenses').insert({
                event_id: eventId,
                payer_id: payerId,
                amount: parseFloat(amount),
                description: description
            }).select().single();

            if (error) throw error;

            // Link selected items
            if (selectedItemIds.size > 0) {
                const { error: linkError } = await supabase
                    .from('shopping_items')
                    .update({ expense_id: expense.id })
                    .in('id', Array.from(selectedItemIds));

                if (linkError) console.error("Error linking items:", linkError);
            }

            // Create splits (Equal split among all participants including payer)
            const share = parseFloat(amount) / participants.length;
            const splits = participants.map(p => ({
                expense_id: expense.id,
                debtor_id: p.user_id,
                share_amount: share
            }));

            const { error: splitError } = await supabase.from('expense_splits').insert(splits);
            if (splitError) throw splitError;

            setAmount('');
            setDescription('');
            setSelectedItemIds(new Set());
            loadData(); // Reload to update list
        } catch (error) {
            console.error("Error adding expense:", error);
        }
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">

            {/* Header / Summary */}
            <div className="bg-indigo-600 dark:bg-indigo-900 text-white rounded-2xl p-6 shadow-lg shadow-indigo-100 dark:shadow-none mb-8">
                <p className="text-indigo-100 dark:text-indigo-200 text-sm font-medium mb-1">Totale Spese</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">€ {totalExpenses.toFixed(2)}</span>
                    <span className="text-indigo-200 text-sm">per questo evento</span>
                </div>
            </div>
            {/* Balances visualization would go here */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                    <Wallet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Bilancio & Debiti
                </h2>
                <div className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                    Aggiungi spese per vedere chi deve dare soldi a chi.
                    (Algoritmo di minimizzazione pronto)
                </div>

                <button onClick={() => alert("Funzionalità di calcolo completa in arrivo!")} className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                    Calcola Rimborsi
                </button>
            </div>

            {/* Add Expense Form */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Aggiungi Spesa</h3>
                <form onSubmit={addExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Descrizione</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="Es. Carne per grigliata"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Importo (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                            placeholder="0.00"
                        />
                    </div>


                    {/* Pending Items Selection */}
                    {pendingItems.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                Collega oggetti spuntati:
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {pendingItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-1 rounded"
                                        onClick={() => {
                                            const newSet = new Set(selectedItemIds);
                                            if (newSet.has(item.id)) {
                                                newSet.delete(item.id);
                                            } else {
                                                newSet.add(item.id);
                                                // Auto-fill description if empty and first item selected
                                                if (!description && newSet.size === 1) {
                                                    setDescription(item.item_name + (item.quantity ? ` (${item.quantity})` : ''));
                                                }
                                            }
                                            setSelectedItemIds(newSet);
                                        }}
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            selectedItemIds.has(item.id)
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-600"
                                        )}>
                                            {selectedItemIds.has(item.id) && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className={cn("text-sm", selectedItemIds.has(item.id) ? "text-indigo-900 dark:text-indigo-200 font-medium" : "text-gray-600 dark:text-gray-400")}>
                                            {item.item_name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium">
                        Registra Spesa
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Divisa equamente tra tutti i partecipanti</p>
                </form>
            </div >

            {/* Expenses List */}
            < div className="space-y-3" >
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Ultime spese</h3>
                {expenses.map((expense) => {
                    const payer = participants.find(p => p.user_id === expense.payer_id);
                    return (
                        <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors gap-3 sm:gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                                    {payer?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white capitalize truncate">{expense.description}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Pagato da <span className="font-semibold text-gray-700 dark:text-gray-300">{payer?.username || 'Sconosciuto'}</span>
                                        {' • '}
                                        {new Date(expense.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right sm:text-right pl-14 sm:pl-0">
                                <p className="font-bold text-gray-900 dark:text-white">€ {expense.amount.toFixed(2)}</p>
                            </div>
                        </div>
                    );
                })}

                {expenses.length === 0 && (
                    <div className="p-12 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                        <p>Nessuna spesa registrata</p>
                    </div>
                )}
            </div>
        </div >
    );
}
