import { useState } from 'react';
import ShoppingList from './ShoppingList';
import ExpenseTracker from './ExpenseTracker';
import EventSettings from './EventSettings';
import { ShoppingCart, Wallet, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    eventId: string;
}

export default function EventView({ eventId }: Props) {
    const [activeTab, setActiveTab] = useState<'shopping' | 'expenses' | 'settings'>('shopping');

    return (
        <div>
            <div className="flex bg-white rounded-t-xl border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('shopping')}
                    className={cn(
                        "flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 transition-colors relative",
                        activeTab === 'shopping' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-tl-xl"
                    )}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Lista Spesa
                    {activeTab === 'shopping' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={cn(
                        "flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 transition-colors relative",
                        activeTab === 'expenses' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-tr-xl"
                    )}
                >
                    <Wallet className="w-4 h-4" />
                    Spese & Conti
                    {activeTab === 'expenses' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                        "flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 transition-colors relative",
                        activeTab === 'settings' ? "text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-tr-xl"
                    )}
                >
                    <Settings className="w-4 h-4" />
                    Impostazioni
                    {activeTab === 'settings' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
            </div>

            <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 p-6 min-h-[500px]">
                {activeTab === 'shopping' ? (
                    <ShoppingList eventId={eventId} />
                ) : activeTab === 'expenses' ? (
                    <ExpenseTracker eventId={eventId} />
                ) : (
                    <EventSettings eventId={eventId} />
                )}
            </div>
        </div>
    );
}
