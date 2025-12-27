import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_CZTop7a8.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_mZ6eLEod.mjs';
export { renderers } from '../renderers.mjs';

const $$Signup = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Registrati - Ruchi" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "SignupView", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/Code/Ruchi/src/components/SignupView", "client:component-export": "default" })} ` })}`;
}, "C:/Code/Ruchi/src/pages/signup.astro", void 0);

const $$file = "C:/Code/Ruchi/src/pages/signup.astro";
const $$url = "/signup";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Signup,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
