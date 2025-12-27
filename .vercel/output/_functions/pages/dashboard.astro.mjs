import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BmgwVtGw.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DHr84r7r.mjs';
export { renderers } from '../renderers.mjs';

const $$Dashboard = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="max-w-4xl mx-auto p-4"> <header class="flex justify-between items-center mb-8 py-4 border-b"> <h1 class="text-2xl font-bold">I tuoi Eventi</h1> <button class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
+ Nuovo Evento
</button> </header> <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> <div class="p-6 bg-white rounded-xl shadow-sm border border-gray-100 text-center text-gray-500"> <p>Caricamento eventi...</p> <!-- TODO: implement event list fetching --> </div> </div> </div> ` })}`;
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
