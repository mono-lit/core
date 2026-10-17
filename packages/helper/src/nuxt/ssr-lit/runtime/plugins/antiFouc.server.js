import { defineNuxtPlugin, useHead } from "#imports";
export default defineNuxtPlugin(() => {
  useHead({
    style: [
      {
        innerHTML: "body[dsd-pending] { display: none; }"
      }
    ],
    script: [
      {
        children: `
{
  const hasNativeDsd =
    Object.hasOwnProperty.call(HTMLTemplateElement.prototype, "shadowRootMode") ||
    Object.hasOwnProperty.call(HTMLTemplateElement.prototype, "shadowRoot");

  if (!hasNativeDsd) {
      document.body.setAttribute('dsd-pending', 'true');
  }
}`,
        tagPosition: "bodyOpen"
      }
    ]
  });
});
