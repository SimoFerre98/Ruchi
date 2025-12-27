import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_CZTop7a8.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_mZ6eLEod.mjs';
export { renderers } from '../renderers.mjs';

const $$Profile = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Profilo - Ruchi" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "ProfileSettings", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/Code/Ruchi/src/components/ProfileSettings", "client:component-export": "default" })} ` })}`;
}, "C:/Code/Ruchi/src/pages/profile.astro", void 0);

const $$file = "C:/Code/Ruchi/src/pages/profile.astro";
const $$url = "/profile";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Profile,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
