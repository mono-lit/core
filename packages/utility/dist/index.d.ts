import { i as monoEcosystem, n as MonoEcosystemOptions, r as mergeEcosystem } from "./merge-file-C5nzi_MY.js";
import { Plugin } from "vite";

//#region src/composables/vite-html-to-vue.d.ts
type HtmlToVueOptions = {
  overridePath?: string;
  components?: {
    path: string;
    outDir?: string;
  };
  pages: {
    list: Array<{
      html: string;
      pagePath?: string;
    }>;
  };
};
declare function htmlToVue(options: HtmlToVueOptions): Plugin;
//#endregion
//#region src/composables/html-path.d.ts
declare function htmlPath({
  dir,
  dirname
}: {
  dir: string;
  dirname: string;
}): Record<string, string>;
//#endregion
export { type MonoEcosystemOptions, htmlPath, htmlToVue, mergeEcosystem, monoEcosystem };