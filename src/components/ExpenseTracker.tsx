import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { minimizeDebts, cn } from '../lib/utils';
import { Plus, Wallet, ArrowRight, ShoppingBag, Check } from 'lucide-react';

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

    if (loading) return <div>Caricamento contabilità...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8">

            {/* Summary Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                    Bilancio & Debiti
                </h2>

                {/* Balances visualization would go here */}
                <div className="text-center text-gray-500 py-4 text-sm">
                    Aggiungi spese per vedere chi deve dare soldi a chi.
                    (Algoritmo di minimizzazione pronto)
                </div>

                <button onClick={() => alert("Funzionalità di calcolo completa in arrivo!")} className="text-indigo-600 text-sm hover:underline">
                    Calcola Rimborsi
                </button>
            </div>

            {/* Add Expense Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold mb-4">Aggiungi Spesa</h3>
                <form onSubmit={addExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Descrizione</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Es. Carne per grigliata"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-700 mb-1">Importo (€)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>


                    {/* Pending Items Selection */}
                    {pendingItems.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                Collega oggetti spuntati:
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {pendingItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded"
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
                                                : "bg-white border-gray-300"
                                        )}>
                                            {selectedItemIds.has(item.id) && <Check className="w-3 h-3" />}
                                        </div>
                                        <span className={cn("text-sm", selectedItemIds.has(item.id) ? "text-indigo-900 font-medium" : "text-gray-600")}>
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
                    <p className="text-xs text-gray-400 text-center">Divisa equamente tra tutti i partecipanti</p>
                </form>
            </div >

            {/* Expenses List */}
            < div className="space-y-3" >
                <h3 className="font-semibold text-gray-700">Ultime spese</h3>
                {
                    expenses.map(exp => (
                        <div key={exp.id} className="bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="font-medium">{exp.description}</p>
                                <p className="text-sm text-gray-500">Pagato da {participants.find(p => p.user_id === exp.payer_id)?.username || 'Qualcuno'}</p>
                            </div>
                            <span className="font-bold text-lg">€{exp.amount}</span>
                        </div>
                    ))
                }
                {expenses.length === 0 && <p className="text-gray-400 text-center italic">Nessuna spesa registrata</p>}
            </div >
        </div >
    );
}
