import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_BmgwVtGw.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_DHr84r7r.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShoppingCart, Check, Trash2, Plus, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export { renderers } from '../../renderers.mjs';

{
  console.warn("Missing Supabase environment variables");
}
const supabase = createClient(
  "",
  ""
);

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function ShoppingList({ eventId }) {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [loading, setLoading] = useState(true);
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
        if (payload.eventType === "INSERT") {
          setItems((prev) => [...prev, payload.new]);
        } else if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        } else if (payload.eventType === "UPDATE") {
          setItems(
            (prev) => prev.map((i) => i.id === payload.new.id ? payload.new : i)
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
    if (!newItemName.trim()) return;
    try {
      const { error } = await supabase.from("shopping_items").insert({
        event_id: eventId,
        item_name: newItemName,
        quantity: newItemQty,
        is_bought: false
      });
      if (error) throw error;
      setNewItemName("");
      setNewItemQty("");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Errore aggiunta oggetto. Sei loggato?");
    }
  }
  async function toggleBought(item) {
    try {
      const { error } = await supabase.from("shopping_items").update({ is_bought: !item.is_bought }).eq("id", item.id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating item:", error);
    }
  }
  async function deleteItem(id) {
    try {
      const { error } = await supabase.from("shopping_items").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
  if (loading) return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: "Caricamento..." });
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-100 p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "w-5 h-5 text-indigo-600" }),
        "Lista Spesa"
      ] }),
      /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-400", children: [
        items.filter((i) => i.is_bought).length,
        "/",
        items.length,
        " presi"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-8", children: [
      items.map((item) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
            item.is_bought ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-200 hover:border-indigo-200"
          ),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => toggleBought(item),
                  className: cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    item.is_bought ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"
                  ),
                  children: item.is_bought && /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" })
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: item.is_bought ? "line-through text-gray-400" : "", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: item.item_name }),
                item.quantity && /* @__PURE__ */ jsx("span", { className: "ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full", children: item.quantity })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => deleteItem(item.id),
                className: "text-gray-300 hover:text-red-500 p-2",
                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
              }
            )
          ]
        },
        item.id
      )),
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-center text-gray-400 py-8 italic", children: "Nessun oggetto in lista. Aggiungi qualcosa!" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: addItem, className: "flex gap-2 border-t pt-4", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Cosa serve?",
          value: newItemName,
          onChange: (e) => setNewItemName(e.target.value),
          className: "flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Qt.",
          value: newItemQty,
          onChange: (e) => setNewItemQty(e.target.value),
          className: "w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "submit",
          disabled: !newItemName.trim(),
          className: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
            /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Aggiungi" })
          ]
        }
      )
    ] })
  ] });
}

function ExpenseTracker({ eventId }) {
  const [expenses, setExpenses] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [balances, setBalances] = useState({});
  const [simplifiedDebts, setSimplifiedDebts] = useState([]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [eventId]);
  async function loadData() {
    try {
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
    } catch (error) {
      console.error("Error loading expense data:", error);
    } finally {
      setLoading(false);
    }
  }
  async function addExpense(e) {
    e.preventDefault();
    if (!amount || !description) return;
    try {
      const user = await supabase.auth.getUser();
      const payerId = user.data.user?.id;
      if (!payerId) {
        alert("Devi essere loggato");
        return;
      }
      const { data: expense, error } = await supabase.from("expenses").insert({
        event_id: eventId,
        payer_id: payerId,
        amount: parseFloat(amount),
        description
      }).select().single();
      if (error) throw error;
      const share = parseFloat(amount) / participants.length;
      const splits = participants.map((p) => ({
        expense_id: expense.id,
        debtor_id: p.user_id,
        share_amount: share
      }));
      const { error: splitError } = await supabase.from("expense_splits").insert(splits);
      if (splitError) throw splitError;
      setAmount("");
      setDescription("");
      loadData();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  }
  if (loading) return /* @__PURE__ */ jsx("div", { children: "Caricamento contabilità..." });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl shadow-sm border border-gray-100", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold mb-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Wallet, { className: "w-5 h-5 text-indigo-600" }),
        "Bilancio & Debiti"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-center text-gray-500 py-4 text-sm", children: "Aggiungi spese per vedere chi deve dare soldi a chi. (Algoritmo di minimizzazione pronto)" }),
      /* @__PURE__ */ jsx("button", { onClick: () => alert("Funzionalità di calcolo completa in arrivo!"), className: "text-indigo-600 text-sm hover:underline", children: "Calcola Rimborsi" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-xl shadow-sm border border-gray-100", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold mb-4", children: "Aggiungi Spesa" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: addExpense, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 mb-1", children: "Descrizione" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none",
              placeholder: "Es. Carne per grigliata"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm text-gray-700 mb-1", children: "Importo (€)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              step: "0.01",
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              className: "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none",
              placeholder: "0.00"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium", children: "Registra Spesa" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 text-center", children: "Divisa equamente tra tutti i partecipanti" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-700", children: "Ultime spese" }),
      expenses.map((exp) => /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-lg border border-gray-100 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: exp.description }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Pagato da ",
            participants.find((p) => p.user_id === exp.payer_id)?.username || "Qualcuno"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-lg", children: [
          "€",
          exp.amount
        ] })
      ] }, exp.id)),
      expenses.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-center italic", children: "Nessuna spesa registrata" })
    ] })
  ] });
}

function EventView({ eventId }) {
  const [activeTab, setActiveTab] = useState("shopping");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex bg-white rounded-t-xl border-b border-gray-200", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("shopping"),
          className: cn(
            "flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 transition-colors relative",
            activeTab === "shopping" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-tl-xl"
          ),
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { className: "w-4 h-4" }),
            "Lista Spesa",
            activeTab === "shopping" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setActiveTab("expenses"),
          className: cn(
            "flex-1 py-4 text-center font-medium text-sm flex items-center justify-center gap-2 transition-colors relative",
            activeTab === "expenses" ? "text-indigo-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-tr-xl"
          ),
          children: [
            /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4" }),
            "Spese & Conti",
            activeTab === "expenses" && /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-b-xl shadow-sm border border-t-0 border-gray-100 p-6 min-h-[500px]", children: activeTab === "shopping" ? /* @__PURE__ */ jsx(ShoppingList, { eventId }) : /* @__PURE__ */ jsx(ExpenseTracker, { eventId }) })
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
