import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Check, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ShoppingItem {
    id: string;
    event_id: string;
    item_name: string;
    quantity: string | null;
    notes: string | null;
    is_bought: boolean;
    claimed_by: string | null;
    expense_id: string | null;
}

interface Props {
    eventId: string;
}

export default function ShoppingList({ eventId }: Props) {
    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [newItemNotes, setNewItemNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchItems();

        const channel = supabase
            .channel('shopping_list')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shopping_items',
                    filter: `event_id=eq.${eventId}`,
                },
                (payload) => {
                    console.log('Change received!', payload);
                    // Simple approach: refetch or optimistic update. 
                    // For robustness/simplicity in this prototype, let's refetch or handle specific events.
                    // To ensure we don't lose order or state, handling types is better.
                    const newItem = payload.new as ShoppingItem;
                    if (payload.eventType === 'INSERT') {
                        setItems((prev) => {
                            if (prev.find(i => i.id === newItem.id)) return prev;
                            return [...prev, newItem];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setItems((prev) =>
                            prev.map((i) => (i.id === newItem.id ? newItem : i))
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    async function fetchItems() {
        try {
            const { data, error } = await supabase
                .from('shopping_items')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setLoading(false);
        }
    }

    async function addItem(e: React.FormEvent) {
        e.preventDefault();
        if (!newItemName.trim() || adding) return; // Prevent double submit

        setAdding(true);
        const tempId = crypto.randomUUID();
        const optimisticItem: ShoppingItem = {
            id: tempId,
            event_id: eventId,
            item_name: newItemName,
            quantity: newItemQty,
            notes: newItemNotes,
            is_bought: false,
            claimed_by: null,
            expense_id: null
        };

        // Optimistic update
        setItems(prev => [...prev, optimisticItem]);
        setNewItemName('');
        setNewItemQty('');
        setNewItemNotes('');

        try {
            const { data, error } = await supabase.from('shopping_items').insert({
                event_id: eventId,
                item_name: optimisticItem.item_name,
                quantity: optimisticItem.quantity,
                notes: optimisticItem.notes,
                is_bought: false
            }).select().single();

            if (error) throw error;

            // Replace temp item with real one
            setItems(prev => prev.map(i => i.id === tempId ? data : i));
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Errore aggiunta oggetto.');
            // Revert optimistic add
            setItems(prev => prev.filter(i => i.id !== tempId));
        } finally {
            setAdding(false);
        }
    }

    async function toggleBought(item: ShoppingItem) {
        // Optimistic update
        const updatedItem = { ...item, is_bought: !item.is_bought };
        setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));

        try {
            const { error } = await supabase
                .from('shopping_items')
                .update({ is_bought: updatedItem.is_bought })
                .eq('id', item.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating item:', error);
            // Revert on error
            setItems(prev => prev.map(i => i.id === item.id ? item : i));
        }
    }

    async function deleteItem(id: string) {
        const previousItems = items;
        setItems(prev => prev.filter(i => i.id !== id));

        try {
            const { error } = await supabase.from('shopping_items').delete().eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error("Error deleting item:", error);
            setItems(previousItems);
        }
    }

    if (loading) return <div className="text-center py-8">Caricamento...</div>;

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    Lista Spesa
                </h2>
                <span className="text-sm text-gray-400">
                    {items.filter(i => i.is_bought).length}/{items.length} presi
                </span>
            </div>

            <div className="space-y-3 mb-8">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "flex items-center gap-3 p-4 rounded-xl transition-all group animate-in slide-in-from-bottom-2 duration-300",
                            item.is_bought
                                ? "bg-gray-50/80 dark:bg-gray-800/50"
                                : "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
                        )}
                    >
                        <button
                            onClick={() => toggleBought(item)} // Changed from toggleItem(item.id, item.is_bought)
                            className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                                item.is_bought
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500"
                            )}
                        >
                            <Check className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <span className={cn(
                                "block font-medium truncate",
                                item.is_bought ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200"
                            )}>
                                {item.item_name}
                            </span>
                            {item.quantity && (
                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                    {item.quantity}
                                </span>
                            )}
                            {item.notes && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.notes}</p>
                            )}
                        </div>

                        <button
                            onClick={() => deleteItem(item.id)}
                            className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity" // Added group-hover for delete button
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {items.length === 0 && (
                    <p className="text-center text-gray-400 py-8 italic">
                        Nessun oggetto in lista. Aggiungi qualcosa!
                    </p>
                )}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2 border-t pt-4 border-gray-200 dark:border-gray-700"> {/* Changed form onSubmit */}
                {/* Removed original newItemName, newItemQty, newItemNotes inputs */}
                <div className="flex flex-col md:flex-row gap-2 mb-4 md:mb-0">
                    <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Aggiungi prodotto..."
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                        onKeyDown={(e) => e.key === 'Enter' && addItem(e)}
                    />
                    <button
                        onClick={addItem}
                        disabled={!newItemName.trim() || adding}
                        className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center"
                    >
                        {adding ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                        <span className="md:hidden ml-2 font-medium">Aggiungi</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
