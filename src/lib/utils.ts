import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Types for optimization
 */
type Transaction = {
    from: string;
    to: string;
    amount: number;
};

type Balance = {
    [userId: string]: number;
};

/**
 * Minimizes cash flow (Splitwise-like algorithm)
 * Uses a greedy approach to settle debts.
 */
export function minimizeDebts(balances: Balance): Transaction[] {
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    for (const [userId, amount] of Object.entries(balances)) {
        if (amount > 0.01) creditors.push({ id: userId, amount });
        else if (amount < -0.01) debtors.push({ id: userId, amount });
    }

    // Sort by amount magnitude (descending) to optimize matching
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => a.amount - b.amount); // Most negative first

    const transactions: Transaction[] = [];

    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];

        // The amount to settle is the minimum of what creditor needs and what debtor owes
        // Note: debtor.amount is negative, so we take -debtor.amount
        const amount = Math.min(creditor.amount, -debtor.amount);

        transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount: Number(amount.toFixed(2)),
        });

        // Update remaining amounts
        creditor.amount -= amount;
        debtor.amount += amount;

        // If fully settled, move to next
        if (creditor.amount < 0.01) i++;
        if (debtor.amount > -0.01) j++;
    }

    return transactions;
}
