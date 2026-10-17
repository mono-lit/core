<script>
import { defineComponent, ssrUtils, mergeProps } from "vue";
import { ssrRenderVNode, ssrRenderAttrs } from "@vue/server-renderer";
import { LitElementRenderer } from "@lit-labs/ssr/lib/lit-element-renderer.js";
import { createLitElementRenderer } from "../utils/litElementRenderer";
export default defineComponent({
  ssrRender(ctx, push, litWrapperInstance, litWrapperAttrs) {
    const [litElementVNode] = litWrapperInstance.slots.default();
    const litElementTagName = String(litElementVNode.type);
    const litElementVNodeProps = litElementVNode.props || {};
    const renderer = createLitElementRenderer(litElementTagName, litElementVNodeProps);
    if (!renderer) {
      return null;
    }
    try {
      renderer.connectedCallback();
      const attributes = ssrRenderAttrs(mergeProps(litElementVNodeProps, litWrapperAttrs));
      push(
        `<${litElementTagName}${attributes} defer-hydration="true"><template shadowrootmode="open" shadowroot="open">`
      );
      for (const shadowContent of renderer.renderShadow({
        elementRenderers: [LitElementRenderer],
        customElementInstanceStack: [renderer],
        customElementHostStack: [renderer]
      })) {
        push(shadowContent);
      }
      push(`</template>`);
      const litElementChildren = litElementVNode.children ? Array.isArray(litElementVNode.children) ? litElementVNode.children : [litElementVNode.children] : [];
      litElementChildren.forEach((child) => ssrRenderVNode(push, ssrUtils.normalizeVNode(child), litWrapperInstance));
      push(`</${litElementTagName}>`);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
});
</script>
