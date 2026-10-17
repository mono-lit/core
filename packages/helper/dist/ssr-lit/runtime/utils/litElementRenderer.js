import { LitElementRenderer } from "@lit-labs/ssr/lib/lit-element-renderer.js";
import { getCustomElementConstructor, isCustomElementTag } from "./customElements.js";
export function createLitElementRenderer(tagName, props) {
  if (!isCustomElementTag(tagName)) {
    return null;
  }
  const renderer = new LitElementRenderer(tagName);
  attachPropsToRenderer(renderer, props);
  return renderer;
}
function attachPropsToRenderer(renderer, props) {
  const customElementConstructor = getCustomElementConstructor(renderer.tagName);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (customElementConstructor !== null && typeof customElementConstructor !== "string" && key in customElementConstructor.prototype) {
        const isBooleanProp = customElementConstructor.elementProperties.get(key)?.type === Boolean;
        if (isBooleanProp && value === "") {
          renderer.setProperty(key, true);
        } else {
          renderer.setProperty(key, value);
        }
      } else {
        renderer.setAttribute(key, value);
      }
    }
  }
  return renderer;
}
