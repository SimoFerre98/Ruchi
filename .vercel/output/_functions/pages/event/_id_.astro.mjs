import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_knHkETCx.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_hBNIOAGi.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as supabase } from '../../chunks/supabase_Be3T3tq4.mjs';
import { ListChecks, Check, Trash2, Loader2, Plus, PieChart as PieChart$1, ArrowRightLeft, ShoppingBag, DollarSign, Settings, Copy, Users, Shield, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
export { renderers } from '../../renderers.mjs';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function minimizeDebts(balances) {
  const creditors = [];
  const debtors = [];
  for (const [userId, amount] of Object.entries(balances)) {
    if (amount > 0.01) creditors.push({ id: userId, amount });
    else if (amount < -0.01) debtors.push({ id: userId, amount });
  }
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => a.amount - b.amount);
  const transactions = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.amount, -debtor.amount);
    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Number(amount.toFixed(2))
    });
    creditor.amount -= amount;
    debtor.amount += amount;
    if (creditor.amount < 0.01) i++;
    if (debtor.amount > -0.01) j++;
  }
  return transactions;
}

function ShoppingList({ eventId }) {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingQty, setEditingQty] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  function startEdit(item) {
    setEditingId(item.id);
    setEditingName(item.item_name);
    setEditingQty(item.quantity || "");
    setEditingNotes(item.notes || "");
  }
  async function saveEdit(id) {
    if (!editingName.trim()) return;
    const updatedItem = {
      id,
      item_name: editingName,
      quantity: editingQty || null,
      notes: editingNotes || null
    };
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updatedItem } : i));
    setEditingId(null);
    try {
      const { error } = await supabase.from("shopping_items").update({
        item_name: updatedItem.item_name,
        quantity: updatedItem.quantity,
        notes: updatedItem.notes
      }).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating item details:", error);
      alert("Errore salvataggio modifica.");
    }
  }
  useEffect(() => {
    fetchItems();
    const channel = supabase.channel("shopping_list").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "shopping_items",
        filter: `event_id=eq.${eventId}`
      },
      (payload) => {
        console.log("Change received!", payload);
        const newItem = payload.new;
        if (payload.eventType === "INSERT") {
          setItems((prev) => {
            if (prev.find((i) => i.id === newItem.id)) return prev;
            return [...prev, newItem];
          });
        } else if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        } else if (payload.eventType === "UPDATE") {
          setItems(
            (prev) => prev.map((i) => i.id === newItem.id ? newItem : i)
          );
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);
  async function fetchItems() {
    try {
      const { data, error } = await supabase.from("shopping_items").select("*").eq("event_id", eventId).order("created_at", { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  }
  async function addItem(e) {
    e.preventDefault();
    if (!newItemName.trim() || adding) return;
    setAdding(true);
    const tempId = crypto.randomUUID();
    const optimisticItem = {
      id: tempId,
      event_id: eventId,
      item_name: newItemName,
      quantity: newItemQty,
      notes: newItemNotes,
      is_bought: false,
      claimed_by: null,
      expense_id: null
    };
    setItems((prev) => [...prev, optimisticItem]);
    setNewItemName("");
    setNewItemQty("");
    setNewItemNotes("");
    try {
      const { data, error } = await supabase.from("shopping_items").insert({
        event_id: eventId,
        item_name: optimisticItem.item_name,
        quantity: optimisticItem.quantity,
        notes: optimisticItem.notes,
        is_bought: false
      }).select().single();
      if (error) throw error;
      setItems((prev) => prev.map((i) => i.id === tempId ? data : i));
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Errore aggiunta oggetto.");
      setItems((prev) => prev.filter((i) => i.id !== tempId));
    } finally {
      setAdding(false);
    }
  }
  async function toggleBought(item) {
    const updatedItem = { ...item, is_bought: !item.is_bought };
    setItems((prev) => prev.map((i) => i.id === item.id ? updatedItem : i));
    try {
      const { error } = await supabase.from("shopping_items").update({ is_bought: updatedItem.is_bought }).eq("id", item.id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating item:", error);
      setItems((prev) => prev.map((i) => i.id === item.id ? item : i));
    }
  }
  async function deleteItem(id) {
    const previousItems = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const { error } = await supabase.from("shopping_items").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting item:", error);
      setItems(previousItems);
    }
  }
  if (loading) return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: "Caricamento..." });
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ListChecks, { className: "w-5 h-5 text-indigo-600" }),
        "Lista"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-400", children: [
        items.filter((i) => i.is_bought).length,
        "/",
        items.length,
        " completati"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-8", children: [
      items.map((item) => /* @__PURE__ */ jsx(
        "div",
        {
          className: cn(
            "flex items-center gap-3 p-4 rounded-xl transition-all group animate-in slide-in-from-bottom-2 duration-300",
            item.is_bought ? "bg-gray-50/80 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
          ),
          children: editingId === item.id ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-2", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: editingName,
                onChange: (e) => setEditingName(e.target.value),
                className: "px-2 py-1 border rounded",
                placeholder: "Nome"
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editingQty,
                  onChange: (e) => setEditingQty(e.target.value),
                  className: "w-1/3 px-2 py-1 border rounded",
                  placeholder: "Qtà"
                }
              ),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: editingNotes,
                  onChange: (e) => setEditingNotes(e.target.value),
                  className: "flex-1 px-2 py-1 border rounded",
                  placeholder: "Note"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setEditingId(null),
                  className: "text-xs text-gray-500 underline",
                  children: "Annulla"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => saveEdit(item.id),
                  className: "text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg",
                  children: "Salva"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => toggleBought(item),
                className: cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
                  item.is_bought ? "bg-green-500 border-green-500 text-white" : "border-gray-300 dark:border-gray-600 text-transparent hover:border-green-500"
                ),
                children: /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" })
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex-1 min-w-0 cursor-pointer",
                onClick: () => startEdit(item),
                children: [
                  /* @__PURE__ */ jsx("span", { className: cn(
                    "block font-medium truncate",
                    item.is_bought ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-700 dark:text-gray-200"
                  ), children: item.item_name }),
                  item.quantity && /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full", children: item.quantity }),
                  item.notes && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: item.notes })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteItem(item.id),
                className: "text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ] })
        },
        item.id
      )),
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-gray-400 py-8 italic", children: "La lista è vuota. Aggiungi elementi!" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => e.preventDefault(), className: "flex flex-col gap-2 border-t pt-4 border-gray-200 dark:border-gray-700", children: [
      " ",
      /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-3 mb-4 md:mb-0", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: newItemName,
            onChange: (e) => setNewItemName(e.target.value),
            placeholder: "Aggiungi elemento...",
            className: "flex-[2] px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-400",
            onKeyDown: (e) => e.key === "Enter" && addItem(e)
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-1", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: newItemQty,
              onChange: (e) => setNewItemQty(e.target.value),
              placeholder: "Qtà",
              className: "w-1/3 min-w-[60px] px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-400",
              onKeyDown: (e) => e.key === "Enter" && addItem(e)
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: newItemNotes,
              onChange: (e) => setNewItemNotes(e.target.value),
              placeholder: "Note (opz)",
              className: "flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-400",
              onKeyDown: (e) => e.key === "Enter" && addItem(e)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: addItem,
            disabled: !newItemName.trim() || adding,
            className: "bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none flex items-center justify-center flex-shrink-0",
            children: [
              adding ? /* @__PURE__ */ jsx(Loader2, { className: "w-6 h-6 animate-spin" }) : /* @__PURE__ */ jsx(Plus, { className: "w-6 h-6" }),
              /* @__PURE__ */ jsx("span", { className: "md:hidden ml-2 font-medium", children: "Aggiungi" })
            ]
          }
        )
      ] }) })
    ] })
  ] });
}

const CATEGORIES = [
  { id: "cibo", label: "Cibo & Spesa", color: "#10B981" },
  // Emerald 500
  { id: "trasporti", label: "Trasporti", color: "#3B82F6" },
  // Blue 500
  { id: "alloggio", label: "Alloggio", color: "#8B5CF6" },
  // Violet 500
  { id: "attivita", label: "Attività & Cultura", color: "#06b6d4" },
  // Cyan 500
  { id: "svago", label: "Svago & Nightlife", color: "#F59E0B" },
  // Amber 500
  { id: "regali", label: "Regali", color: "#ec4899" },
  // Pink 500
  { id: "rimborso", label: "Rimborso", color: "#EF4444" },
  // Red 500
  { id: "altro", label: "Altro", color: "#6B7280" }
  // Gray 500
];
function ExpenseTracker({ eventId }) {
  const [expenses, setExpenses] = useState([]);
  const [splits, setSplits] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [balances, setBalances] = useState({});
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(/* @__PURE__ */ new Set());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("altro");
  const [isSettlementMode, setIsSettlementMode] = useState(false);
  const [settlementReceiver, setSettlementReceiver] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [splitType, setSplitType] = useState("EQUAL");
  const [customSplitValues, setCustomSplitValues] = useState({});
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
      const { data: participantsData, error: partError } = await supabase.from("participants").select("user_id, profiles(username)").eq("event_id", eventId);
      if (partError) throw partError;
      const parts = participantsData?.map((p) => ({
        user_id: p.user_id,
        username: p.profiles?.username || "Unknown"
      })) || [];
      setParticipants(parts);
      const { data: expensesData, error: expError } = await supabase.from("expenses").select("*").eq("event_id", eventId).order("created_at", { ascending: false });
      if (expError) throw expError;
      setExpenses(expensesData || []);
      if (expensesData && expensesData.length > 0) {
        const expenseIds = expensesData.map((e) => e.id);
        const { data: splitsData } = await supabase.from("expense_splits").select("*").in("expense_id", expenseIds);
        setSplits(splitsData || []);
      } else {
        setSplits([]);
      }
      const { data: pendingData, error: pendingError } = await supabase.from("shopping_items").select("*").eq("event_id", eventId).eq("is_bought", true).is("expense_id", null);
      if (pendingError) console.error("Error fetching pending items:", pendingError);
      setPendingItems(pendingData || []);
    } catch (error) {
      console.error("Error loading expense data:", error);
    } finally {
      setLoading(false);
    }
  }
  function calculateBalances() {
    const bal = {};
    participants.forEach((p) => bal[p.user_id] = 0);
    expenses.forEach((exp) => {
      bal[exp.payer_id] = (bal[exp.payer_id] || 0) + exp.amount;
      const expSplits = splits.filter((s) => s.expense_id === exp.id);
      if (expSplits.length > 0) {
        expSplits.forEach((split) => {
          bal[split.debtor_id] = (bal[split.debtor_id] || 0) - split.share_amount;
        });
      } else {
        const share = exp.amount / participants.length;
        participants.forEach((p) => {
          bal[p.user_id] = (bal[p.user_id] || 0) - share;
        });
      }
    });
    setBalances(bal);
    setSimplifiedDebts(minimizeDebts(bal));
  }
  async function addTransaction(e) {
    e.preventDefault();
    if (!amount) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    try {
      if (!currentUser) {
        alert("Devi essere loggato");
        return;
      }
      if (editingExpenseId) {
        const desc = isSettlementMode ? `Rimborso a ${participants.find((p) => p.user_id === settlementReceiver)?.username}` : description;
        const cat = isSettlementMode ? "rimborso" : category;
        const { error: updateError } = await supabase.from("expenses").update({
          amount: numAmount,
          description: desc,
          category: cat
        }).eq("id", editingExpenseId);
        if (updateError) throw updateError;
        await supabase.from("expense_splits").delete().eq("expense_id", editingExpenseId);
        if (isSettlementMode) {
          await supabase.from("expense_splits").insert({
            expense_id: editingExpenseId,
            debtor_id: settlementReceiver,
            share_amount: numAmount
          });
        } else {
          let newSplits = [];
          if (splitType === "EQUAL") {
            const share = numAmount / participants.length;
            newSplits = participants.map((p) => ({ expense_id: editingExpenseId, debtor_id: p.user_id, share_amount: share }));
          } else if (splitType === "PERCENTAGE") {
            newSplits = participants.map((p) => ({
              expense_id: editingExpenseId,
              debtor_id: p.user_id,
              share_amount: numAmount * (parseFloat(customSplitValues[p.user_id] || "0") / 100)
            }));
          } else if (splitType === "SHARES") {
            let totalShares = 0;
            participants.forEach((p) => totalShares += parseFloat(customSplitValues[p.user_id] || "0"));
            const shareBase = totalShares === 0 ? numAmount / participants.length : numAmount / totalShares;
            newSplits = participants.map((p) => ({
              expense_id: editingExpenseId,
              debtor_id: p.user_id,
              share_amount: totalShares === 0 ? shareBase : shareBase * parseFloat(customSplitValues[p.user_id] || "0")
            }));
          }
          await supabase.from("expense_splits").insert(newSplits);
        }
      } else if (isSettlementMode) {
        if (!settlementReceiver) {
          alert("Seleziona a chi inviare i soldi");
          return;
        }
        const desc = `Rimborso a ${participants.find((p) => p.user_id === settlementReceiver)?.username}`;
        const { data: expense, error } = await supabase.from("expenses").insert({
          event_id: eventId,
          payer_id: currentUser.id,
          amount: numAmount,
          description: desc,
          category: "rimborso",
          is_settlement: true
        }).select().single();
        if (error) throw error;
        const { error: splitError } = await supabase.from("expense_splits").insert({
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
        const { data: expense, error } = await supabase.from("expenses").insert({
          event_id: eventId,
          payer_id: currentUser.id,
          amount: numAmount,
          description,
          category
        }).select().single();
        if (error) throw error;
        if (selectedItemIds.size > 0) {
          await supabase.from("shopping_items").update({ expense_id: expense.id }).in("id", Array.from(selectedItemIds));
        }
        let newSplits = [];
        if (splitType === "EQUAL") {
          const share = numAmount / participants.length;
          newSplits = participants.map((p) => ({
            expense_id: expense.id,
            debtor_id: p.user_id,
            share_amount: share
          }));
        } else if (splitType === "PERCENTAGE") {
          let totalPct = 0;
          participants.forEach((p) => {
            const val = parseFloat(customSplitValues[p.user_id] || "0");
            totalPct += val;
          });
          if (Math.abs(totalPct - 100) > 0.1) {
            alert(`Attenzione: il totale delle percentuali è ${totalPct}%, dovrebbe essere 100%. Gli importi potrebbero non essere precisi.`);
          }
          newSplits = participants.map((p) => {
            const val = parseFloat(customSplitValues[p.user_id] || "0");
            return {
              expense_id: expense.id,
              debtor_id: p.user_id,
              share_amount: numAmount * (val / 100)
            };
          });
        } else if (splitType === "SHARES") {
          let totalShares = 0;
          participants.forEach((p) => {
            const val = parseFloat(customSplitValues[p.user_id] || "0");
            totalShares += val;
          });
          if (totalShares === 0) {
            const share = numAmount / participants.length;
            newSplits = participants.map((p) => ({
              expense_id: expense.id,
              debtor_id: p.user_id,
              share_amount: share
            }));
          } else {
            newSplits = participants.map((p) => {
              const val = parseFloat(customSplitValues[p.user_id] || "0");
              return {
                expense_id: expense.id,
                debtor_id: p.user_id,
                share_amount: numAmount * (val / totalShares)
              };
            });
          }
        }
        const { error: splitError } = await supabase.from("expense_splits").insert(newSplits);
        if (splitError) throw splitError;
      }
      setAmount("");
      setDescription("");
      setCategory("altro");
      setIsSettlementMode(false);
      setSettlementReceiver("");
      setSelectedItemIds(/* @__PURE__ */ new Set());
      setEditingExpenseId(null);
      setSplitType("EQUAL");
      loadData();
    } catch (error) {
      console.error("Error adding transaction:", error);
      if (error.message?.includes("category") || error.message?.includes("is_settlement")) {
        alert("Errore DB: Colonne mancanti. Assicurati che le migrazioni siano state eseguite.");
      } else {
        alert("Errore inserimento: " + error.message);
      }
    }
  }
  const realExpenses = expenses.filter((e) => !e.is_settlement && e.category !== "rimborso");
  const totalExpenses = realExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expensesByCategory = realExpenses.reduce((acc, exp) => {
    const cat = exp.category || "altro";
    acc[cat] = (acc[cat] || 0) + exp.amount;
    return acc;
  }, {});
  const chartData = Object.entries(expensesByCategory).map(([catId, value]) => {
    const catDef = CATEGORIES.find((c) => c.id === catId) || CATEGORIES.find((c) => c.id === "altro");
    return {
      name: catDef.label,
      value,
      color: catDef.color
    };
  }).filter((d) => d.value > 0);
  const userBalance = currentUser ? balances[currentUser.id] || 0 : 0;
  if (loading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin mx-auto text-indigo-600" }) });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-indigo-600 dark:bg-indigo-900 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-sm font-medium mb-1", children: "Totale Spese Evento" }),
          /* @__PURE__ */ jsxs("span", { className: "text-4xl font-bold tracking-tight", children: [
            "€ ",
            totalExpenses.toFixed(2)
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: cn(
          "rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-colors",
          userBalance >= 0 ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800"
        ), children: [
          /* @__PURE__ */ jsx("p", { className: cn("text-sm font-medium mb-1", userBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"), children: "Il tuo Bilancio" }),
          /* @__PURE__ */ jsxs("span", { className: cn("text-3xl font-bold", userBalance >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"), children: [
            userBalance >= 0 ? "+" : "",
            "€ ",
            userBalance.toFixed(2)
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1 dark:text-gray-400", children: userBalance > 0 ? "Devi ricevere soldi" : userBalance < 0 ? "Devi dare soldi" : "Sei in pari" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center min-h-[200px]", children: chartData.length > 0 ? /* @__PURE__ */ jsx("div", { className: "w-full h-[180px] text-xs", children: /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs(PieChart, { children: [
        /* @__PURE__ */ jsx(Pie, { data: chartData, cx: "50%", cy: "50%", innerRadius: 40, outerRadius: 70, paddingAngle: 5, dataKey: "value", children: chartData.map((entry, index) => /* @__PURE__ */ jsx(Cell, { fill: entry.color, strokeWidth: 0 }, `cell-${index}`)) }),
        /* @__PURE__ */ jsx(Tooltip, { formatter: (value) => `€ ${Number(value).toFixed(2)}`, contentStyle: { backgroundColor: "#fff", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" } }),
        /* @__PURE__ */ jsx(Legend, { verticalAlign: "middle", align: "right", layout: "vertical", iconType: "circle" })
      ] }) }) }) : /* @__PURE__ */ jsxs("div", { className: "text-center text-gray-400 text-sm", children: [
        /* @__PURE__ */ jsx(PieChart$1, { className: "w-8 h-8 mx-auto mb-2 opacity-50" }),
        "Nessun dato"
      ] }) })
    ] }),
    simplifiedDebts.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white", children: [
        /* @__PURE__ */ jsx(ArrowRightLeft, { className: "w-5 h-5 text-indigo-600" }),
        "Rimborsi Suggeriti"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: simplifiedDebts.map((debt, i) => {
        const fromUser = participants.find((p) => p.user_id === debt.from);
        const toUser = participants.find((p) => p.user_id === debt.to);
        const isMe = currentUser?.id === debt.from;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300", children: [
            /* @__PURE__ */ jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: fromUser?.username }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "→" }),
            /* @__PURE__ */ jsx("div", { className: "font-medium text-gray-900 dark:text-white", children: toUser?.username })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxs("span", { className: "font-bold text-gray-900 dark:text-white", children: [
              "€ ",
              debt.amount.toFixed(2)
            ] }),
            isMe && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setIsSettlementMode(true);
                  setSettlementReceiver(debt.to);
                  setAmount(debt.amount.toString());
                  setCategory("rimborso");
                  setDescription("");
                  window.scrollTo({ top: 500, behavior: "smooth" });
                },
                className: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded text-xs font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors",
                children: "Paga"
              }
            )
          ] })
        ] }, i);
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-100 dark:border-gray-800 relative", children: [
        editingExpenseId && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 backdrop-blur-[1px]", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-indigo-600 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-sm border border-indigo-100", children: "Modifica Spesa" }) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsSettlementMode(false),
            className: cn("flex-1 py-3 text-sm font-medium transition-colors", !isSettlementMode ? "bg-gray-50 dark:bg-gray-800 text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"),
            children: "Nuova Spesa"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsSettlementMode(true),
            className: cn("flex-1 py-3 text-sm font-medium transition-colors", isSettlementMode ? "bg-gray-50 dark:bg-gray-800 text-emerald-600 border-b-2 border-emerald-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"),
            children: "Regola Conto"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: addTransaction, className: "p-6 space-y-4", children: [
        !isSettlementMode ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 dark:text-gray-300 mb-1", children: "Descrizione" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: description,
                  onChange: (e) => setDescription(e.target.value),
                  className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white",
                  placeholder: "Descrizione"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2 md:col-span-1", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 dark:text-gray-300 mb-1", children: "Categoria" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: category,
                  onChange: (e) => setCategory(e.target.value),
                  className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white app-select",
                  children: CATEGORIES.map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, disabled: cat.id === "rimborso", children: cat.label }, cat.id))
                }
              )
            ] })
          ] }),
          pendingItems.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-300", children: [
              /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4" }),
              " Collega oggetti:"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: pendingItems.map((item) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  const newSet = new Set(selectedItemIds);
                  if (newSet.has(item.id)) newSet.delete(item.id);
                  else {
                    newSet.add(item.id);
                    if (!description && newSet.size === 1) {
                      setDescription(item.item_name);
                      setCategory("cibo");
                    }
                  }
                  setSelectedItemIds(newSet);
                },
                className: cn(
                  "px-2 py-1 text-xs rounded border transition-colors",
                  selectedItemIds.has(item.id) ? "bg-indigo-100 border-indigo-200 text-indigo-700 font-semibold dark:bg-indigo-900 dark:border-indigo-700 dark:text-indigo-300" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                ),
                children: item.item_name
              },
              item.id
            )) })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 dark:text-gray-300 mb-1", children: "A chi stai inviando soldi?" }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: participants.filter((p) => p.user_id !== currentUser?.id).map((p) => /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => setSettlementReceiver(p.user_id),
              className: cn(
                "p-3 rounded-lg border text-left flex items-center gap-2 transition-all",
                settlementReceiver === p.user_id ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-900/30 dark:border-emerald-600 dark:ring-emerald-600" : "bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
              ),
              children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-xs border dark:border-gray-600 dark:text-white", children: p.username.charAt(0) }),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-sm text-gray-900 dark:text-white", children: p.username })
              ]
            },
            p.user_id
          )) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 dark:text-gray-300 mb-1", children: "Importo (€)" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                step: "0.01",
                placeholder: "0.00",
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                className: "w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              }
            )
          ] })
        ] }),
        !isSettlementMode && /* @__PURE__ */ jsxs("div", { className: "pt-2 border-t border-gray-100 dark:border-gray-800 mt-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 dark:text-gray-300 mb-2", children: "Divisione Spesa" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSplitType("EQUAL"),
                className: cn(
                  "flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                  splitType === "EQUAL" ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                ),
                children: "Equo"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSplitType("PERCENTAGE"),
                className: cn(
                  "flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                  splitType === "PERCENTAGE" ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                ),
                children: "%"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSplitType("SHARES"),
                className: cn(
                  "flex-1 py-1.5 text-xs font-medium rounded border transition-colors",
                  splitType === "SHARES" ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400"
                ),
                children: "Quote"
              }
            )
          ] }),
          splitType !== "EQUAL" && /* @__PURE__ */ jsx("div", { className: "space-y-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700", children: participants.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-700 dark:text-gray-300 max-w-[120px] truncate", children: p.username }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "any",
                  placeholder: splitType === "PERCENTAGE" ? "0%" : "1",
                  value: customSplitValues[p.user_id] || "",
                  onChange: (e) => setCustomSplitValues((prev) => ({ ...prev, [p.user_id]: e.target.value })),
                  className: "w-20 px-2 py-1 border rounded text-right bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-gray-400 w-4 text-xs", children: splitType === "PERCENTAGE" ? "%" : "Q" })
            ] })
          ] }, p.user_id)) })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: cn(
              "w-full py-3 rounded-xl text-white font-medium transition-all shadow-md",
              isSettlementMode ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
            ),
            children: isSettlementMode ? "Registra Rimborso" : editingExpenseId ? "Salva Modifiche" : "Aggiungi Spesa"
          }
        ),
        editingExpenseId && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setEditingExpenseId(null);
              setAmount("");
              setDescription("");
              setCategory("altro");
              setIsSettlementMode(false);
              setSplitType("EQUAL");
            },
            className: "w-full py-3 mt-2 rounded-xl text-gray-500 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            children: "Annulla"
          }
        ),
        isSettlementMode && /* @__PURE__ */ jsx("p", { className: "text-xs text-center text-gray-500", children: "Questo azzererà parzialmente il debito tra voi due." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-700 dark:text-gray-300 px-1", children: "Cronologia" }),
      expenses.map((expense) => {
        const payer = participants.find((p) => p.user_id === expense.payer_id);
        const isSettlement = expense.is_settlement || expense.category === "rimborso";
        const catDef = CATEGORIES.find((c) => c.id === (expense.category || "altro"));
        return /* @__PURE__ */ jsxs("div", { className: cn(
          "flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border transition-colors gap-3 relative overflow-hidden",
          isSettlement ? "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/10" : "border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900"
        ), children: [
          /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1", style: { backgroundColor: isSettlement ? "#10B981" : catDef?.color || "#ccc" } }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 pl-2", children: [
            /* @__PURE__ */ jsx("div", { className: cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm",
              isSettlement ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
            ), children: isSettlement ? /* @__PURE__ */ jsx(ArrowRightLeft, { className: "w-5 h-5" }) : payer?.username?.charAt(0).toUpperCase() || "?" }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white capitalize truncate", children: expense.description }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400", children: [
                !isSettlement && expense.payer_id === currentUser?.id && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      setEditingExpenseId(expense.id);
                      setAmount(expense.amount.toString());
                      setDescription(expense.description);
                      setCategory(expense.category);
                      setIsSettlementMode(false);
                      setSplitType("EQUAL");
                      window.scrollTo({ top: 500, behavior: "smooth" });
                    },
                    className: "text-indigo-600 hover:underline mr-1 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded",
                    children: "Modifica"
                  }
                ),
                isSettlement && expense.payer_id === currentUser?.id && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      setEditingExpenseId(expense.id);
                      setAmount(expense.amount.toString());
                      setIsSettlementMode(true);
                      const split = splits.find((s) => s.expense_id === expense.id);
                      if (split) setSettlementReceiver(split.debtor_id);
                      setSplitType("EQUAL");
                      window.scrollTo({ top: 500, behavior: "smooth" });
                    },
                    className: "text-emerald-600 hover:underline mr-1 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded",
                    children: "Modifica"
                  }
                ),
                isSettlement ? /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400 font-medium", children: "Rimborso" }) : /* @__PURE__ */ jsx("span", { className: "bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", style: { color: catDef?.color }, children: catDef?.label }),
                /* @__PURE__ */ jsx("span", { children: "•" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  isSettlement ? "Da " : "Pagato da ",
                  " ",
                  payer?.username || "Sconosciuto"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right sm:text-right pl-14 sm:pl-0 flex flex-row sm:flex-col justify-between items-center sm:items-end w-full sm:w-auto mt-2 sm:mt-0", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 sm:hidden", children: new Date(expense.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: cn("font-bold text-gray-900 dark:text-white", isSettlement && "text-emerald-600 dark:text-emerald-400"), children: [
                "€ ",
                expense.amount.toFixed(2)
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 hidden sm:block", children: new Date(expense.created_at).toLocaleDateString() })
            ] })
          ] })
        ] }, expense.id);
      }),
      expenses.length === 0 && /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-gray-400 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700", children: /* @__PURE__ */ jsx("p", { children: "Nessuna spesa registrata" }) })
    ] })
  ] });
}

function EventSettings({ eventId }) {
  const [inviteCode, setInviteCode] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    loadSettings();
  }, [eventId]);
  async function loadSettings() {
    try {
      const user = await supabase.auth.getUser();
      setCurrentUser(user.data.user);
      const { data: event, error: eventError } = await supabase.from("events").select("invite_code").eq("id", eventId).single();
      if (eventError) throw eventError;
      setInviteCode(event.invite_code);
      const { data: parts, error: partsError } = await supabase.from("participants").select(`
                    user_id,
                    role,
                    joined_at,
                    profiles (username, avatar_url)
                `).eq("event_id", eventId);
      if (partsError) throw partsError;
      const formattedParts = parts.map((p) => ({
        user_id: p.user_id,
        role: p.role,
        joined_at: p.joined_at,
        username: p.profiles?.username || "Utente sconosciuto",
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
      alert("Codice copiato!");
    }
  };
  if (loading) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-gray-500", children: "Caricamento impostazioni..." });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }),
        "Codice Invito"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700", children: [
        /* @__PURE__ */ jsx("code", { className: "text-2xl font-mono font-bold tracking-widest text-indigo-600 dark:text-indigo-400 flex-1 text-center", children: inviteCode }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: copyCode,
            className: "p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent hover:border-gray-200 dark:hover:border-gray-600",
            title: "Copia codice",
            children: /* @__PURE__ */ jsx(Copy, { className: "w-5 h-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400 mt-2 text-center", children: "Condividi questo codice con i tuoi amici per farli entrare nell'evento." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Users, { className: "w-5 h-5 text-indigo-600 dark:text-indigo-400" }),
        "Partecipanti (",
        participants.length,
        ")"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: participants.map((participant) => /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0", children: participant.avatar_url ? /* @__PURE__ */ jsx("img", { src: participant.avatar_url, alt: participant.username, className: "w-full h-full object-cover" }) : participant.username.charAt(0).toUpperCase() }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("p", { className: "font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "truncate", children: participant.username }),
            participant.user_id === currentUser?.id && /* @__PURE__ */ jsx("span", { className: "text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800 flex-shrink-0", children: "Io" }),
            participant.role === "admin" && /* @__PURE__ */ jsx("span", { title: "Admin", className: "flex-shrink-0", children: /* @__PURE__ */ jsx(Shield, { className: "w-3 h-3 text-amber-500" }) })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: [
            "Membro dal ",
            new Date(participant.joined_at).toLocaleDateString()
          ] })
        ] })
      ] }) }, participant.user_id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-xl border border-red-100 bg-red-50/50 opacity-60", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-red-800 mb-2", children: "Zona Pericolo" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-red-600 mb-4", children: "Eliminare l'evento o abbandonarlo sono azioni irreversibili." }),
      /* @__PURE__ */ jsx("button", { disabled: true, className: "text-xs bg-white border border-red-200 text-red-400 px-3 py-1.5 rounded cursor-not-allowed", children: "Abbandona Evento" })
    ] })
  ] });
}

function EventView({ eventId }) {
  const [activeTab, setActiveTab] = useState("shopping");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex bg-white dark:bg-gray-900 rounded-t-xl border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrolbar-hide", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("shopping"),
          className: cn(
            "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
            activeTab === "shopping" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tl-xl"
          ),
          children: [
            /* @__PURE__ */ jsx(ListChecks, { className: "w-3.5 h-3.5 md:w-4 md:h-4" }),
            "Lista",
            activeTab === "shopping" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("expenses"),
          className: cn(
            "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
            activeTab === "expenses" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          ),
          children: [
            /* @__PURE__ */ jsx(Wallet, { className: "w-3.5 h-3.5 md:w-4 md:h-4" }),
            "Spese & Conti",
            activeTab === "expenses" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("settings"),
          className: cn(
            "flex-1 py-3 md:py-4 px-2 min-w-[100px] text-center font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-colors relative whitespace-nowrap",
            activeTab === "settings" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-tr-xl"
          ),
          children: [
            /* @__PURE__ */ jsx(Settings, { className: "w-3.5 h-3.5 md:w-4 md:h-4" }),
            "Impostazioni",
            activeTab === "settings" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-gray-900 rounded-b-xl shadow-sm border border-t-0 border-gray-100 dark:border-gray-800 p-4 md:p-6 min-h-[500px]", children: activeTab === "shopping" ? /* @__PURE__ */ jsx(ShoppingList, { eventId }) : activeTab === "expenses" ? /* @__PURE__ */ jsx(ExpenseTracker, { eventId }) : /* @__PURE__ */ jsx(EventSettings, { eventId }) })
  ] });
}

const $$Astro = createAstro();
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `Evento ${id}` }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-4xl mx-auto p-4"> <a href="/dashboard" class="text-indigo-600 hover:underline mb-4 inline-block">&larr; Torna alla Dashboard</a> <header class="mb-8"> <h1 class="text-3xl font-bold mb-2">Dettaglio Evento</h1> <p class="text-gray-500">ID: ${id}</p> </header> <div class="mt-6"> ${renderComponent($$result2, "EventView", EventView, { "client:load": true, "eventId": id || "", "client:component-hydration": "load", "client:component-path": "C:/Code/Ruchi/src/components/EventView", "client:component-export": "default" })} </div> </div> ` })}`;
}, "C:/Code/Ruchi/src/pages/event/[id].astro", void 0);

const $$file = "C:/Code/Ruchi/src/pages/event/[id].astro";
const $$url = "/event/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$id,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
