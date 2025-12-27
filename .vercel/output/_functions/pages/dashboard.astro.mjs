import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CZTop7a8.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_mZ6eLEod.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { s as supabase } from '../chunks/supabase_Be3T3tq4.mjs';
import { Loader2, User, UserPlus, Plus, Calendar, ArrowRight } from 'lucide-react';
import 'clsx';
export { renderers } from '../renderers.mjs';

function DashboardView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  useEffect(() => {
    fetchEvents();
  }, []);
  async function fetchEvents() {
    try {
      setError(null);
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
      }
      const { data, error: fetchError } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message || "Errore di caricamento eventi");
    } finally {
      setLoading(false);
    }
  }
  async function createEvent(e) {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setIsCreating(true);
    try {
      const user = await supabase.auth.getUser();
      let userId = user.data.user?.id;
      if (!userId) {
        const { data, error: error2 } = await supabase.auth.signInAnonymously();
        if (error2) throw error2;
        userId = data.user?.id;
      }
      if (!userId) throw new Error("Utente non autenticato");
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: event, error: eventError } = await supabase.from("events").insert({
        title: newEventTitle,
        created_by: userId,
        invite_code: inviteCode
      }).select().single();
      if (eventError) throw eventError;
      const { error: partError } = await supabase.from("participants").insert({
        event_id: event.id,
        user_id: userId,
        role: "admin"
      });
      if (partError) throw partError;
      await fetchEvents();
      setNewEventTitle("");
    } catch (error2) {
      console.error("Error creating event:", error2);
      alert(`Errore creazione evento: ${error2.message || JSON.stringify(error2)}`);
    } finally {
      setIsCreating(false);
    }
  }
  async function handleJoinEvent(e) {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Devi essere loggato");
      const { data: eventId, error: error2 } = await supabase.rpc("join_event_by_code", { _invite_code: joinCode });
      if (error2) throw error2;
      window.location.href = `/event/${eventId}`;
    } catch (error2) {
      console.error("Error joining event:", error2);
      alert(`Errore: ${error2.message}`);
    }
  }
  if (loading) return /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-gray-500 flex flex-col items-center gap-4", children: [
    /* @__PURE__ */ jsx(Loader2, { className: "w-8 h-8 animate-spin text-indigo-600" }),
    /* @__PURE__ */ jsx("p", { children: "Caricamento eventi..." })
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-6 md:p-8 space-y-6 md:space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("img", { src: "/logo.png", alt: "Ruchi", className: "w-12 h-12 rounded-xl shadow-sm" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl md:text-3xl font-bold text-gray-900 dark:text-white", children: "I tuoi Eventi" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm md:text-base text-gray-500 dark:text-gray-400", children: "Gestisci le tue spese condivise" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 self-end md:self-auto", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "/profile",
            className: "w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-gray-200 dark:border-gray-700 shadow-sm",
            title: "Il tuo profilo",
            children: /* @__PURE__ */ jsx(User, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          isJoining ? /* @__PURE__ */ jsxs("form", { onSubmit: handleJoinEvent, className: "flex gap-2 animate-in fade-in slide-in-from-right-4 items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "CODICE...",
                value: joinCode,
                onChange: (e) => setJoinCode(e.target.value.toUpperCase()),
                className: "w-24 md:w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm",
                autoFocus: true
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                className: "bg-gray-900 dark:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-black dark:hover:bg-gray-600 transition text-sm font-medium whitespace-nowrap",
                children: "Entra"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsJoining(false),
                className: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-1",
                children: "✕"
              }
            )
          ] }) : /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setIsJoining(true),
              className: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-2 font-medium text-sm md:text-base shadow-sm",
              children: [
                /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Unisciti" }),
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Entra" })
              ]
            }
          ),
          isCreating ? /* @__PURE__ */ jsxs("form", { onSubmit: createEvent, className: "flex gap-2 animate-in fade-in slide-in-from-right-4 items-center", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Nome...",
                value: newEventTitle,
                onChange: (e) => setNewEventTitle(e.target.value),
                className: "w-32 md:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm",
                autoFocus: true
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: !newEventTitle.trim(),
                className: "bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm whitespace-nowrap",
                children: "Crea"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setIsCreating(false),
                className: "text-gray-500 hover:text-gray-700 px-1",
                children: "✕"
              }
            )
          ] }) : !isJoining && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setIsCreating(true),
              className: "bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm shadow-indigo-200 dark:shadow-none text-sm md:text-base",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Nuovo Evento" }),
                /* @__PURE__ */ jsx("span", { className: "sm:hidden", children: "Nuovo" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    error ? /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-12 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50", children: [
      /* @__PURE__ */ jsx("p", { className: "font-bold", children: "Errore di connessione" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: error }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Controlla la console e il file .env" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: events.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "col-span-full p-8 md:p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400", children: [
      /* @__PURE__ */ jsx(Calendar, { className: "w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "Nessun evento presente" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Creane uno nuovo per iniziare!" })
    ] }) : events.map((event) => /* @__PURE__ */ jsxs(
      "a",
      {
        href: `/event/${event.id}`,
        className: "group block p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600 dark:text-indigo-400", children: /* @__PURE__ */ jsx(Calendar, { className: "w-6 h-6" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400", children: event.invite_code })
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 dark:text-white mb-2", children: event.title }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500 dark:text-gray-400 mb-4", children: [
            "Creato il ",
            new Date(event.created_at).toLocaleDateString()
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-medium", children: [
            "Gestisci ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" })
          ] })
        ]
      },
      event.id
    )) })
  ] });
}

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-6xl mx-auto p-4"> ${renderComponent($$result2, "DashboardView", DashboardView, { "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Code/Ruchi/src/components/DashboardView", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Code/Ruchi/src/pages/dashboard.astro", void 0);

const $$file = "C:/Code/Ruchi/src/pages/dashboard.astro";
const $$url = "/dashboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Dashboard,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
