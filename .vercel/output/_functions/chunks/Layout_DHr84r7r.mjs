import { e as createComponent, f as createAstro, h as addAttribute, l as renderHead, n as renderSlot, r as renderTemplate } from './astro/server_BmgwVtGw.mjs';
import 'piccolore';
import 'clsx';
/* empty css                             */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="it"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title} - Ruchi</title>${renderHead()}</head> <body class="bg-gray-50 text-gray-900 min-h-screen"> ${renderSlot($$result, $$slots["default"])} </body></html>`;
}, "C:/Code/Ruchi/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
