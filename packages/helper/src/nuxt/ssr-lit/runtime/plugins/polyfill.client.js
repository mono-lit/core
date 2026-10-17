import { defineNuxtPlugin } from "#imports";
export default defineNuxtPlugin(async () => {
  const hasNativeDsd = Object.hasOwnProperty.call(HTMLTemplateElement.prototype, "shadowRootMode") || Object.hasOwnProperty.call(HTMLTemplateElement.prototype, "shadowRoot");
  if (!hasNativeDsd) {
    const { hydrateShadowRoots } = await import("@webcomponents/template-shadowroot/template-shadowroot.js");
    hydrateShadowRoots(document.body);
    document.body.removeAttribute("dsd-pending");
  }
});
