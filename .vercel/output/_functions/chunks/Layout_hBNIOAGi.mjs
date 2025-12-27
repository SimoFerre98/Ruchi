import { e as createComponent, f as createAstro, r as renderTemplate, l as renderScript, n as renderSlot, o as renderHead, h as addAttribute } from './astro/server_knHkETCx.mjs';
import 'piccolore';
import 'clsx';
/* empty css                             */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="it"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"', '><link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#4f46e5"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><title>', " - Ruchi</title><script>\n			const theme = (() => {\n				if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {\n					return localStorage.getItem('theme');\n				}\n				if (window.matchMedia('(prefers-color-scheme: dark)').matches) {\n					return 'dark';\n				}\n				return 'light';\n			})();\n			\n			if (theme === 'dark') {\n				document.documentElement.classList.add('dark');\n			} else {\n				document.documentElement.classList.remove('dark');\n			}\n			\n			window.localStorage.setItem('theme', theme);\n		<\/script>", '</head> <body class="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen transition-colors duration-300 antialiased"> ', " ", " </body> </html>"])), addAttribute(Astro2.generator, "content"), title, renderHead(), renderSlot($$result, $$slots["default"]), renderScript($$result, "C:/Code/Ruchi/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "C:/Code/Ruchi/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
