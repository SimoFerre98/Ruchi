import { useState } from 'react';
import ShoppingList from './ShoppingList';
import ExpenseTracker from './ExpenseTracker';
import EventSettings from './EventSettings';
import { ListChecks, Wallet, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    eventId: string;
}

export default function EventView({ eventId }: Props) {
    const [activeTab, setActiveTab] = useState<'shopping' | 'expenses' | 'settings'>('shopping');

    return (
        <div>
            <div className="flex bg-white dark:bg-gray-900 rounded-t-xl border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrolbar-hide">
                <button
                    onClick={() => setActiveTab('shopping')}
                    className={cn(
                        "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
                        activeTab === 'shopping' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tl-xl"
                    )}
                >
                    <ListChecks className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Lista
                    {activeTab === 'shopping' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={cn(
                        "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
                        activeTab === 'expenses' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                >
                    <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Spese & Conti
                    {activeTab === 'expenses' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={cn(
                        "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
                        activeTab === 'settings' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tr-xl"
                    )}
                >
                    <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Impostazioni
                    {activeTab === 'settings' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                    )}
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-b-xl shadow-sm border border-t-0 border-gray-100 dark:border-gray-800 p-4 md:p-6 min-h-[500px]">
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
