import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { minimizeDebts, cn } from '../lib/utils';
import { Plus, Wallet, ShoppingBag, Check, Loader2, PieChart as PieChartIcon, ArrowRightLeft, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    payer_id: string;
    created_at: string;
    is_settlement?: boolean;
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

const CATEGORIES = [
    { id: 'cibo', label: 'Cibo & Spesa', color: '#10B981' }, // Emerald 500
    { id: 'trasporti', label: 'Trasporti', color: '#3B82F6' }, // Blue 500
    { id: 'alloggio', label: 'Alloggio', color: '#8B5CF6' }, // Violet 500
    { id: 'attivita', label: 'Attività & Cultura', color: '#06b6d4' }, // Cyan 500
    { id: 'svago', label: 'Svago & Nightlife', color: '#F59E0B' }, // Amber 500
    { id: 'regali', label: 'Regali', color: '#ec4899' }, // Pink 500
    { id: 'rimborso', label: 'Rimborso', color: '#EF4444' }, // Red 500
    { id: 'altro', label: 'Altro', color: '#6B7280' }, // Gray 500
];

export default function ExpenseTracker({ eventId }: Props) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [splits, setSplits] = useState<Split[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [balances, setBalances] = useState<Record<string, number>>({});
    const [simplifiedDebts, setSimplifiedDebts] = useState<{ from: string; to: string; amount: number }[]>([]);

    // Linking items
    const [pendingItems, setPendingItems] = useState<ShoppingItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('altro');
    const [isSettlementMode, setIsSettlementMode] = useState(false);
    const [settlementReceiver, setSettlementReceiver] = useState('');
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

    // Split methods
    const [splitType, setSplitType] = useState<'EQUAL' | 'PERCENTAGE' | 'SHARES'>('EQUAL');
    const [customSplitValues, setCustomSplitValues] = useState<Record<string, string>>({});

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [eventId]);

    useEffect(() => {
        if (expenses.length > 0 && participants.length > 0) {
            calculateBalances();
        }
    }, [expenses, splits, participants]);

    async function loadData() {
        try {
            const user = await supabase.auth.getUser();
            setCurrentUser(user.data.user);

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

            // Fetch expenses
            const { data: expensesData, error: expError } = await supabase
                .from('expenses')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (expError) throw expError;
            setExpenses(expensesData || []);

            // Fetch splits (needed for correct balance calculation)
            if (expensesData && expensesData.length > 0) {
                const expenseIds = expensesData.map(e => e.id);
                const { data: splitsData } = await supabase
                    .from('expense_splits')
                    .select('*')
                    .in('expense_id', expenseIds);
                setSplits(splitsData || []);
            } else {
                setSplits([]);
            }

            // Fetch pending shopping items (bought but not linked)
            const { data: pendingData, error: pendingError } = await supabase
                .from('shopping_items')
                .select('*')
                .eq('event_id', eventId)
                .eq('is_bought', true)
                .is('expense_id', null);

            if (pendingError) console.error("Error fetching pending items:", pendingError);
            setPendingItems(pendingData || []);

        } catch (error) {
            console.error("Error loading expense data:", error);
        } finally {
            setLoading(false);
        }
    }

    function calculateBalances() {
        const bal: Record<string, number> = {};
        participants.forEach(p => bal[p.user_id] = 0);

        expenses.forEach(exp => {
            bal[exp.payer_id] = (bal[exp.payer_id] || 0) + exp.amount;

            const expSplits = splits.filter(s => (s as any).expense_id === exp.id);
            if (expSplits.length > 0) {
                expSplits.forEach(split => {
                    bal[split.debtor_id] = (bal[split.debtor_id] || 0) - split.share_amount;
                });
            } else {
                const share = exp.amount / participants.length;
                participants.forEach(p => {
                    bal[p.user_id] = (bal[p.user_id] || 0) - share;
                });
            }
        });

        setBalances(bal);
        setSimplifiedDebts(minimizeDebts(bal));
    }

    async function addTransaction(e: React.FormEvent) {
        e.preventDefault();
        if (!amount) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        try {
            if (!currentUser) {
                alert('Devi essere loggato');
                return;
            }

            if (editingExpenseId) {
                const desc = isSettlementMode ? `Rimborso a ${participants.find(p => p.user_id === settlementReceiver)?.username}` : description;
                const cat = isSettlementMode ? 'rimborso' : category;

                const { error: updateError } = await supabase
                    .from('expenses')
                    .update({
                        amount: numAmount,
                        description: desc,
                        category: cat,
                    })
                    .eq('id', editingExpenseId);

                if (updateError) throw updateError;

                await supabase.from('expense_splits').delete().eq('expense_id', editingExpenseId);

                if (isSettlementMode) {
                    await supabase.from('expense_splits').insert({
                        expense_id: editingExpenseId,
                        debtor_id: settlementReceiver,
                        share_amount: numAmount
                    });
                } else {
                    let newSplits: { expense_id: string; debtor_id: string; share_amount: number }[] = [];
                    if (splitType === 'EQUAL') {
                        const share = numAmount / participants.length;
                        newSplits = participants.map(p => ({ expense_id: editingExpenseId, debtor_id: p.user_id, share_amount: share }));
                    } else if (splitType === 'PERCENTAGE') {
                        newSplits = participants.map(p => ({
                            expense_id: editingExpenseId,
                            debtor_id: p.user_id,
                            share_amount: numAmount * (parseFloat(customSplitValues[p.user_id] || '0') / 100)
                        }));
                    } else if (splitType === 'SHARES') {
                        let totalShares = 0;
                        participants.forEach(p => totalShares += parseFloat(customSplitValues[p.user_id] || '0'));
                        const shareBase = totalShares === 0 ? (numAmount / participants.length) : (numAmount / totalShares);
                        newSplits = participants.map(p => ({
                            expense_id: editingExpenseId,
                            debtor_id: p.user_id,
                            share_amount: totalShares === 0 ? shareBase : (shareBase * parseFloat(customSplitValues[p.user_id] || '0'))
                        }));
                    }
                    await supabase.from('expense_splits').insert(newSplits);
                }
            } else if (isSettlementMode) {
                if (!settlementReceiver) {
                    alert('Seleziona a chi inviare i soldi');
                    return;
                }
                const desc = `Rimborso a ${participants.find(p => p.user_id === settlementReceiver)?.username}`;

                const { data: expense, error } = await supabase.from('expenses').insert({
                    event_id: eventId,
                    payer_id: currentUser.id,
                    amount: numAmount,
                    description: desc,
                    category: 'rimborso',
                    is_settlement: true
                }).select().single();

                if (error) throw error;

                const { error: splitError } = await supabase.from('expense_splits').insert({
                    expense_id: expense.id,
                    debtor_id: settlementReceiver,
                    share_amount: numAmount
                });

                if (splitError) throw splitError;

            } else {
                if (!description) {
                    alert("Inserisci descrizione");
                    return;
                }

                const { data: expense, error } = await supabase.from('expenses').insert({
                    event_id: eventId,
                    payer_id: currentUser.id,
                    amount: numAmount,
                    description: description,
                    category: category
                }).select().single();

                if (error) throw error;

                if (selectedItemIds.size > 0) {
                    await supabase
                        .from('shopping_items')
                        .update({ expense_id: expense.id })
                        .in('id', Array.from(selectedItemIds));
                }

                let newSplits: { expense_id: string; debtor_id: string; share_amount: number }[] = [];

                if (splitType === 'EQUAL') {
                    const share = numAmount / participants.length;
                    newSplits = participants.map(p => ({
                        expense_id: expense.id,
                        debtor_id: p.user_id,
                        share_amount: share
                    }));
                } else if (splitType === 'PERCENTAGE') {
                    // Check total
                    let totalPct = 0;
                    participants.forEach(p => {
                        const val = parseFloat(customSplitValues[p.user_id] || '0');
                        totalPct += val;
                    });

                    if (Math.abs(totalPct - 100) > 0.1) {
                        alert(`Attenzione: il totale delle percentuali è ${totalPct}%, dovrebbe essere 100%. Gli importi potrebbero non essere precisi.`);
                    }

                    newSplits = participants.map(p => {
                        const val = parseFloat(customSplitValues[p.user_id] || '0');
                        return {
                            expense_id: expense.id,
                            debtor_id: p.user_id,
                            share_amount: numAmount * (val / 100)
                        };
                    });

                } else if (splitType === 'SHARES') {
                    let totalShares = 0;
                    participants.forEach(p => {
                        const val = parseFloat(customSplitValues[p.user_id] || '0');
                        totalShares += val;
                    });

                    if (totalShares === 0) {
                        // Fallback to equal if no shares
                        const share = numAmount / participants.length;
                        newSplits = participants.map(p => ({
                            expense_id: expense.id,
                            debtor_id: p.user_id,
                            share_amount: share
                        }));
                    } else {
                        newSplits = participants.map(p => {
                            const val = parseFloat(customSplitValues[p.user_id] || '0');
                            return {
                                expense_id: expense.id,
                                debtor_id: p.user_id,
                                share_amount: numAmount * (val / totalShares)
                            };
                        });
                    }
                }

                const { error: splitError } = await supabase.from('expense_splits').insert(newSplits);
                if (splitError) throw splitError;
            }

            setAmount('');
            setDescription('');
            setCategory('altro');
            setIsSettlementMode(false);
            setSettlementReceiver('');
            setSelectedItemIds(new Set());
            setEditingExpenseId(null);
            setSplitType('EQUAL');
            loadData();
        } catch (error: any) {
            console.error("Error adding transaction:", error);
            if (error.message?.includes('category') || error.message?.includes('is_settlement')) {
                alert("Errore DB: Colonne mancanti. Assicurati che le migrazioni siano state eseguite.");
            } else {
                alert("Errore inserimento: " + error.message);
            }
        }
    }

    const realExpenses = expenses.filter(e => !e.is_settlement && e.category !== 'rimborso');
    const totalExpenses = realExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const expensesByCategory = realExpenses.reduce((acc, exp) => {
        const cat = exp.category || 'altro';
        acc[cat] = (acc[cat] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(expensesByCategory).map(([catId, value]) => {
        const catDef = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'altro')!;
        return {
            name: catDef.label,
            value: value,
            color: catDef.color
        };
    }).filter(d => d.value > 0);

    const userBalance = currentUser ? balances[currentUser.id] || 0 : 0;

    if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2">

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div className="bg-indigo-600 dark:bg-indigo-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">Totale Spese Evento</p>
                            <span className="text-4xl font-bold tracking-tight">€ {totalExpenses.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className={cn(
                        "rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-colors",
                        userBalance >= 0
                            ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800"
                            : "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800"
                    )}>
                        <p className={cn("text-sm font-medium mb-1", userBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                            Il tuo Bilancio
                        </p>
                        <span className={cn("text-3xl font-bold", userBalance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                            {userBalance >= 0 ? '+' : ''}€ {userBalance.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                            {userBalance > 0 ? "Devi ricevere soldi" : userBalance < 0 ? "Devi dare soldi" : "Sei in pari"}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center min-h-[200px]">
                    {chartData.length > 0 ? (
                        <div className="w-full h-[180px] text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => `€ ${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 text-sm">
                            <PieChartIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Nessun dato
                        </div>
                    )}
                </div>
            </div>

            {/* Who Owes Who */}
            {simplifiedDebts.length > 0 && (
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                        <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                        Rimborsi Suggeriti
                    </h2>
                    <div className="space-y-3">
                        {simplifiedDebts.map((debt, i) => {
                            const fromUser = participants.find(p => p.user_id === debt.from);
                            const toUser = participants.find(p => p.user_id === debt.to);
                            const isMe = currentUser?.id === debt.from;

                            return (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <div className="font-medium text-gray-900 dark:text-white">{fromUser?.username}</div>
                                        <span className="text-gray-400">→</span>
                                        <div className="font-medium text-gray-900 dark:text-white">{toUser?.username}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-gray-900 dark:text-white">€ {debt.amount.toFixed(2)}</span>
                                        {isMe && (
                                            <button
                                                onClick={() => {
                                                    setIsSettlementMode(true);
                                                    setSettlementReceiver(debt.to);
                                                    setAmount(debt.amount.toString());
                                                    setCategory('rimborso');
                                                    setDescription('');
                                                    window.scrollTo({ top: 500, behavior: 'smooth' });
                                                }}
                                                className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded text-xs font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                                            >
                                                Paga
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Transaction Form */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex border-b border-gray-100 dark:border-gray-800 relative">
                    {editingExpenseId && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <span className="text-sm font-bold text-indigo-600 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-indigo-100">
                                Modifica Spesa
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => setIsSettlementMode(false)}
                        className={cn("flex-1 py-3 text-sm font-medium transition-colors", !isSettlementMode ? "bg-gray-50 dark:bg-gray-800 text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                    >
                        Nuova Spesa
                    </button>
                    <button
                        onClick={() => setIsSettlementMode(true)}
                        className={cn("flex-1 py-3 text-sm font-medium transition-colors", isSettlementMode ? "bg-gray-50 dark:bg-gray-800 text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300")}
                    >
                        Regola Conto
                    </button>
                </div>

                <form onSubmit={addTransaction} className="p-6 space-y-4">
                    {!isSettlementMode ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Descrizione</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                                        placeholder="Descrizione"
                                    />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white app-select"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.id} value={cat.id} disabled={cat.id === 'rimborso'}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {pendingItems.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <ShoppingBag className="w-4 h-4" /> Collega oggetti:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {pendingItems.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => {
                                                    const newSet = new Set(selectedItemIds);
                                                    if (newSet.has(item.id)) newSet.delete(item.id);
                                                    else {
                                                        newSet.add(item.id);
                                                        if (!description && newSet.size === 1) {
                                                            setDescription(item.item_name);
                                                            setCategory('cibo');
                                                        }
                                                    }
                                                    setSelectedItemIds(newSet);
                                                }}
                                                className={cn("px-2 py-1 text-xs rounded border transition-colors",
                                                    selectedItemIds.has(item.id)
                                                        ? "bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-300"
                                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                                )}
                                            >
                                                {item.item_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">A chi stai inviando soldi?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {participants.filter(p => p.user_id !== currentUser?.id).map(p => (
                                    <button
                                        key={p.user_id}
                                        type="button"
                                        onClick={() => setSettlementReceiver(p.user_id)}
                                        className={cn("p-3 rounded-lg border text-left flex items-center gap-2 transition-all",
                                            settlementReceiver === p.user_id
                                                ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-600 dark:ring-emerald-600"
                                                : "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-xs border dark:border-gray-600 dark:text-white">
                                            {p.username.charAt(0)}
                                        </div>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{p.username}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="pt-2">
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Importo (€)</label>
                        <div className="relative">
                            <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {!isSettlementMode && (
                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-4">
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Divisione Spesa</label>
                            <div className="flex gap-2 mb-3">
                                <button
                                    type="button"
                                    onClick={() => setSplitType('EQUAL')}
                                    className={cn("flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                                        splitType === 'EQUAL'
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                            : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                                    )}
                                >
                                    Equo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitType('PERCENTAGE')}
                                    className={cn("flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                                        splitType === 'PERCENTAGE'
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                            : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                                    )}
                                >
                                    %
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSplitType('SHARES')}
                                    className={cn("flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                                        splitType === 'SHARES'
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                                            : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                                    )}
                                >
                                    Quote
                                </button>
                            </div>

                            {splitType !== 'EQUAL' && (
                                <div className="space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    {participants.map(p => (
                                        <div key={p.user_id} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{p.username}</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder={splitType === 'PERCENTAGE' ? '0%' : '1'}
                                                    value={customSplitValues[p.user_id] || ''}
                                                    onChange={e => setCustomSplitValues(prev => ({ ...prev, [p.user_id]: e.target.value }))}
                                                    className="w-20 px-2 py-1 border rounded text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                                                />
                                                <span className="text-gray-400 w-4 text-xs">{splitType === 'PERCENTAGE' ? '%' : 'Q'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        className={cn("w-full py-3 rounded-xl text-white font-medium transition-all shadow-md",
                            isSettlementMode
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
                        )}
                    >
                        {isSettlementMode ? 'Registra Rimborso' : (editingExpenseId ? 'Salva Modifiche' : 'Aggiungi Spesa')}
                    </button>
                    {editingExpenseId && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditingExpenseId(null);
                                setAmount('');
                                setDescription('');
                                setCategory('altro');
                                setIsSettlementMode(false);
                                setSplitType('EQUAL');
                            }}
                            className="w-full py-3 mt-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Annulla
                        </button>
                    )}
                    {isSettlementMode && <p className="text-xs text-center text-gray-500">Questo azzererà parzialmente il debito tra voi due.</p>}
                </form>
            </div>

            {/* Expenses List */}
            < div className="space-y-3" >
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 px-1">Cronologia</h3>
                {expenses.map((expense) => {
                    const payer = participants.find(p => p.user_id === expense.payer_id);
                    const isSettlement = expense.is_settlement || expense.category === 'rimborso';
                    const catDef = CATEGORIES.find(c => c.id === (expense.category || 'altro'));

                    return (
                        <div key={expense.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border transition-colors gap-3 relative overflow-hidden",
                            isSettlement
                                ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/10"
                                : "border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900"
                        )}>
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: isSettlement ? '#10B981' : (catDef?.color || '#ccc') }} />

                            <div className="flex items-center gap-4 pl-2">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm",
                                    isSettlement
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                )}>
                                    {isSettlement ? <ArrowRightLeft className="w-5 h-5" /> : (payer?.username?.charAt(0).toUpperCase() || '?')}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white capitalize truncate">{expense.description}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        {!isSettlement && expense.payer_id === currentUser?.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingExpenseId(expense.id);
                                                    setAmount(expense.amount.toString());
                                                    setDescription(expense.description);
                                                    setCategory(expense.category);
                                                    setIsSettlementMode(false);
                                                    setSplitType('EQUAL');
                                                    window.scrollTo({ top: 500, behavior: 'smooth' });
                                                }}
                                                className="text-indigo-600 hover:underline mr-1 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded"
                                            >
                                                Modifica
                                            </button>
                                        )}
                                        {isSettlement && expense.payer_id === currentUser?.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingExpenseId(expense.id);
                                                    setAmount(expense.amount.toString());
                                                    setIsSettlementMode(true);
                                                    // Find receiver
                                                    const split = splits.find(s => (s as any).expense_id === expense.id);
                                                    if (split) setSettlementReceiver(split.debtor_id);
                                                    setSplitType('EQUAL');
                                                    window.scrollTo({ top: 500, behavior: 'smooth' });
                                                }}
                                                className="text-emerald-600 hover:underline mr-1 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded"
                                            >
                                                Modifica
                                            </button>
                                        )}

                                        {isSettlement ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Rimborso</span>
                                        ) : (
                                            <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider" style={{ color: catDef?.color }}>{catDef?.label}</span>
                                        )}
                                        <span>•</span>
                                        <span>{isSettlement ? 'Da ' : 'Pagato da '} {payer?.username || 'Sconosciuto'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right sm:text-right pl-14 sm:pl-0 flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                                <span className="text-xs text-gray-400 sm:hidden">{new Date(expense.created_at).toLocaleDateString()}</span>
                                <div>
                                    <p className={cn("font-bold text-gray-900 dark:text-white", isSettlement && "text-emerald-600 dark:text-emerald-400")}>€ {expense.amount.toFixed(2)}</p>
                                    <p className="text-xs text-gray-400 hidden sm:block">{new Date(expense.created_at).toLocaleDateString()}</p>
                                </div>
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
