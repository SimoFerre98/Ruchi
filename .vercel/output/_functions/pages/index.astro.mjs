import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_BmgwVtGw.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_DHr84r7r.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Benvenuto" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="flex flex-col items-center justify-center min-h-screen p-4 text-center"> <h1 class="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent mb-4">
Ruchi
</h1> <p class="text-lg text-gray-600 mb-8 max-w-md">
Gestisci le tue spese condivise e organizza eventi con i tuoi amici in modo semplice e intelligente.
</p> <div class="space-y-4"> <!-- Placeholder for Login/Signup --> <a href="/dashboard" class="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
Entra nella Dashboard
</a> <p class="text-sm text-gray-400">Login non ancora implementato</p> </div> </main> ` })}`;
}, "C:/Code/Ruchi/src/pages/index.astro", void 0);

const $$file = "C:/Code/Ruchi/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Index,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
