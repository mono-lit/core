// src/vite/mono-client-only.ts
import {
  NodeTypes,
  parse as parseTemplate,
} from '@vue/compiler-dom'
import { parse as parseSfc } from '@vue/compiler-sfc'
import type {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  RootNode,
  TemplateChildNode,
} from '@vue/compiler-dom'
import MagicString from 'magic-string'
import type { Plugin } from 'vite'

import { shadowTagsFromScript } from './shadow-manifest'

// Directives that must move from the element ONTO the `<LitWrapper>` wrapper so
// list/conditional rendering works on the wrapper, not inside the shadow host.
// Mirrors `nuxt-ssr-lit`'s `autoLitWrapper` exactly.
const LIT_DIRECTIVES_TO_MOVE = ['v-for', ':key', 'v-if', 'v-else-if', 'v-else']
const litDirectivesRegex = new RegExp(
  LIT_DIRECTIVES_TO_MOVE.map((attr) => `(\\s${attr}(="[^"]*")?)`).join('|'),
  'gi',
)

export interface MonoClientOnlyOptions {
  prefix?: string
  wrapper?: string
  /**
   * Tag names (e.g. `'mono-nav'`) to NOT wrap in the client-only wrapper.
   * Use this for components that are server-rendered by another mechanism
   * (e.g. `@lit-labs/ssr` / `nuxt-ssr-lit` shadow-DOM builds) — wrapping them
   * in `<ClientOnly>` would suppress their server markup.
   */
  exclude?: string[]
  /**
   * Wrap LIGHT `<prefix*>` elements in the client-only wrapper. Default `true`.
   * `false` leaves light tags untouched (they server-render as inert custom-element
   * tags and upgrade in the browser) while the shadow `<LitWrapper>` wrap below
   * keeps working — for apps whose pages are client-only as a whole and must not
   * have each `<mono-*>` deferred past the page's `onMounted`.
   */
  lightWrap?: boolean
  /**
   * Enable the import-driven SSR wrap: a `.vue` file that imports
   * `@mono-lit/helper/ui/shadow/<entry>` gets its matching `<mono-*>` wrapped in
   * `<LitWrapper>` (Declarative Shadow DOM) instead of `<ClientOnly>`. Needs
   * `nuxt-ssr-lit` installed (provides the `<LitWrapper>` component). Default off.
   */
  litWrapper?: boolean
  /** Component name used for the SSR wrap. Default `'LitWrapper'`. */
  litWrapperComponent?: string
  /**
   * Tags to ALWAYS treat as shadow (LitWrapper-wrapped) regardless of per-file
   * imports — for components registered once in a shared plugin. Default `[]`.
   */
  shadowOverride?: string[]
}

function cleanId(id: string): string {
  return id.split('?', 1)[0]
}

function isElement(
  node: TemplateChildNode,
): node is ElementNode {
  return node.type === NodeTypes.ELEMENT
}

function isWhitespaceNode(node: TemplateChildNode): boolean {
  return (
    node.type === NodeTypes.TEXT &&
    node.content.trim() === ''
  )
}


function getStaticAttribute(
  node: ElementNode,
  name: string,
): AttributeNode | undefined {
  return node.props.find(
    prop =>
      prop.type === NodeTypes.ATTRIBUTE &&
      prop.name === name,
  ) as AttributeNode | undefined
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getDirective(
  node: ElementNode,
  name: string,
): DirectiveNode | undefined {
  return node.props.find(
    prop =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === name,
  ) as DirectiveNode | undefined
}

function hasDirective(
  node: ElementNode,
  name: string,
): boolean {
  return Boolean(getDirective(node, name))
}

export function monoClientOnlyPlugin(
  options: MonoClientOnlyOptions = {},
): Plugin {
  const prefix = options.prefix ?? 'mono-'
  const wrapper = options.wrapper ?? 'ClientOnly'
  const litWrapper = options.litWrapper === true
  const litWrapperComponent = options.litWrapperComponent ?? 'LitWrapper'
  const lightWrap = options.lightWrap !== false

  const normalizedPrefix = prefix.toLowerCase()
  const normalizedWrapper = wrapper.toLowerCase()
  const excluded = new Set(
    (options.exclude ?? []).map(tag => tag.toLowerCase()),
  )
  const shadowOverride = new Set(
    (options.shadowOverride ?? []).map(tag => tag.toLowerCase()),
  )

  return {
    name: '@mono-lit/helper:mono-client-only',
    enforce: 'pre',

    transform(source, id) {
      const filename = cleanId(id)

      if (!filename.endsWith('.vue')) {
        return null
      }

      if (
        filename.includes('/node_modules/') ||
        filename.includes('\\node_modules\\')
      ) {
        return null
      }

      if (!source.toLowerCase().includes(`<${normalizedPrefix}`)) {
        return null
      }

      const { descriptor, errors } = parseSfc(source, {
        filename,
      })

      if (errors.length > 0 || !descriptor.template) {
        return null
      }

      // Import-driven shadow tags: which `<mono-*>` this file opted into via a
      // `@mono-lit/helper/ui/shadow/<entry>` import (+ any global override). Empty
      // when the LitWrapper feature is off, so behavior is unchanged.
      const fileShadowTags = new Set<string>()
      if (litWrapper) {
        for (const tag of shadowOverride) fileShadowTags.add(tag)
        const script =
          `${descriptor.scriptSetup?.content ?? ''}\n${descriptor.script?.content ?? ''}`
        for (const tag of shadowTagsFromScript(script)) {
          fileShadowTags.add(tag)
        }
      }

      const template = descriptor.template

      const ast = parseTemplate(template.content, {
        comments: true,
      })

      const magicString = new MagicString(source)
      const templateOffset = template.loc.start.offset

      let changed = false

      /** A `mono-*` element whose shadow build this file imports → SSR-wrapped. */
      function isShadowElement(node: ElementNode): boolean {
        return fileShadowTags.has(node.tag.toLowerCase())
      }

      /** A `mono-*` element that should be `<ClientOnly>`-wrapped. */
      function isMonoElement(node: ElementNode): boolean {
        if (!lightWrap) return false
        const tag = node.tag.toLowerCase()
        if (excluded.has(tag) || fileShadowTags.has(tag)) {
          return false
        }
        return tag.startsWith(normalizedPrefix)
      }

      function isClientOnly(node: ElementNode): boolean {
        return node.tag.toLowerCase() === normalizedWrapper
      }

      /**
       * Wrap a single shadow element in `<LitWrapper>`, moving v-for/:key/v-if/
       * v-else-if/v-else onto the wrapper (so they don't run on the shadow host).
       * No skeleton fallback — the element is server-rendered to DSD.
       */
      function wrapLit(node: ElementNode): void {
        const start = templateOffset + node.loc.start.offset
        const end = templateOffset + node.loc.end.offset

        const moved = node.props.filter(
          (prop): prop is DirectiveNode =>
            prop.type === NodeTypes.DIRECTIVE &&
            !!prop.rawName &&
            LIT_DIRECTIVES_TO_MOVE.includes(prop.rawName),
        )
        const directivesToAdd = moved.length
          ? ` ${moved.map((prop) => prop.loc.source).join(' ')}`
          : ''
        const startTag = `<${litWrapperComponent}${directivesToAdd}>`
        const endTag = `</${litWrapperComponent}>`

        if (node.isSelfClosing) {
          const stripped = source
            .slice(start, end)
            .replace(litDirectivesRegex, '')
            .trim()
          magicString.overwrite(start, end, `${startTag}${stripped}${endTag}`)
        } else {
          const lastProp = node.props.length
            ? node.props[node.props.length - 1]
            : undefined
          const contentStart = lastProp
            ? templateOffset + lastProp.loc.end.offset
            : start + node.tag.length + 2
          const stripped = source
            .slice(start, contentStart)
            .replace(litDirectivesRegex, '')
            .trim()
          magicString.overwrite(start, contentStart, stripped)
          magicString.prependLeft(start, startTag)
          magicString.appendRight(end, endTag)
        }

        changed = true
      }

      function wrapRange(
        firstNode: ElementNode,
        lastNode: ElementNode,
      ): void {
        const start =
          templateOffset + firstNode.loc.start.offset

        const end =
          templateOffset + lastNode.loc.end.offset

        /*
         * Read a static attribute's value and strip it (plus its preceding
         * whitespace) from the Mono Web Component — these attributes are only
         * intended for the <ClientOnly> fallback, not the real component.
         */
        function extractAndRemoveStaticAttr(name: string): string {
          const attribute = getStaticAttribute(firstNode, name)

          if (!attribute) {
            return ''
          }

          const attributeStart =
            templateOffset + attribute.loc.start.offset

          const attributeEnd =
            templateOffset + attribute.loc.end.offset

          let removalStart = attributeStart

          /*
           * Remove preceding whitespace too, without crossing into
           * another attribute or the opening tag.
           */
          while (
            removalStart > start &&
            /\s/.test(source[removalStart - 1] ?? '')
          ) {
            removalStart--
          }

          magicString.remove(
            removalStart,
            attributeEnd,
          )

          return attribute.value?.content.trim() ?? ''
        }

        /*
         * Fallback skeleton: a flex container of `count` gray bars.
         *   client-skeleton-type  layout — 'col' (vertical, default) | 'row' (horizontal)
         *   client-skeleton-bar    utility classes applied to EACH bar (e.g. "w-full h-20")
         *   client-skeleton-count  number of bars (default 1)
         *   client-skeleton-class  utility classes applied to the container
         */
        const skeletonClass = extractAndRemoveStaticAttr(
          'client-skeleton-class',
        )

        const skeletonType =
          extractAndRemoveStaticAttr('client-skeleton-type') || 'col'

        const skeletonBar = extractAndRemoveStaticAttr(
          'client-skeleton-bar',
        )

        const skeletonCountRaw = extractAndRemoveStaticAttr(
          'client-skeleton-count',
        )

        const parsedCount = Number.parseInt(skeletonCountRaw, 10)
        const skeletonCount =
          Number.isFinite(parsedCount) && parsedCount > 0
            ? Math.min(parsedCount, 100)
            : 1

        const containerClasses = [
          'mono-client-skeleton',
          `mono-client-skeleton--${skeletonType}`,
          skeletonClass,
        ]
          .filter(Boolean)
          .join(' ')

        const barClasses = [
          'mono-client-skeleton-bar',
          skeletonBar,
        ]
          .filter(Boolean)
          .join(' ')

        const bars = Array.from(
          { length: skeletonCount },
          () =>
            `    <div class="${escapeHtmlAttribute(barClasses)}"></div>`,
        ).join('\n')

        magicString.prependLeft(
          start,
          `<${wrapper}>`,
        )

        magicString.appendRight(
          end,
          [
            '',
            '<template #fallback>',
            `  <div class="${escapeHtmlAttribute(containerClasses)}" aria-hidden="true">`,
            bars,
            '  </div>',
            '</template>',
            `</${wrapper}>`,
          ].join('\n'),
        )

        changed = true
      }

      function visitChildren(
        children: TemplateChildNode[],
        insideClientOnly: boolean,
        insideMonoElement: boolean,
      ): void {
        let index = 0

        while (index < children.length) {
          const node = children[index]

          if (!isElement(node)) {
            index++
            continue
          }

          const nodeIsClientOnly = isClientOnly(node)
          const nodeIsMono = isMonoElement(node)

          /*
           * Shadow element (its shadow build is imported in this file): wrap in
           * <LitWrapper> for SSR — handled BEFORE the v-if chain logic so a
           * shadow element with v-if/v-for moves those onto the wrapper instead
           * of being grouped into a ClientOnly chain. Each shadow element gets
           * its OWN wrapper, including nested ones in another shadow element's
           * slotted (light-DOM) content — e.g. `<mono-input>` inside `<mono-card>`
           * — so they each server-render (matches nuxt-ssr-lit). Skipped only
           * inside a ClientOnly / light-mono parent (already client-only there).
           */
          if (isShadowElement(node)) {
            if (!insideClientOnly && !insideMonoElement) {
              wrapLit(node)
            }
            visitChildren(node.children, insideClientOnly, insideMonoElement)
            index++
            continue
          }

          /*
           * Handle a complete conditional chain:
           *
           * v-if
           * v-else-if
           * v-else
           */
          if (hasDirective(node, 'if')) {
            const conditionalElements: ElementNode[] = [node]

            let cursor = index + 1

            while (cursor < children.length) {
              const nextNode = children[cursor]

              // Whitespace AND comments between branches are allowed by Vue. Stopping
              // at a comment split the chain: the v-if…v-else-if part went inside
              // <ClientOnly> and the trailing v-else was left outside, orphaned —
              // which the Vue compiler crashes on ("reading 'type'").
              if (isWhitespaceNode(nextNode) || nextNode.type === NodeTypes.COMMENT) {
                cursor++
                continue
              }

              if (
                isElement(nextNode) &&
                (
                  hasDirective(nextNode, 'else-if') ||
                  hasDirective(nextNode, 'else')
                )
              ) {
                conditionalElements.push(nextNode)
                cursor++

                if (hasDirective(nextNode, 'else')) {
                  break
                }

                continue
              }

              break
            }

            const chainContainsMono =
              conditionalElements.some(isMonoElement)

            const shouldWrapChain =
              chainContainsMono &&
              !insideClientOnly &&
              !insideMonoElement

            if (shouldWrapChain) {
              wrapRange(
                conditionalElements[0],
                conditionalElements[
                  conditionalElements.length - 1
                ],
              )
            }

            for (const conditionalNode of conditionalElements) {
              const conditionalIsMono =
                isMonoElement(conditionalNode)

              const conditionalIsClientOnly =
                isClientOnly(conditionalNode)

              visitChildren(
                conditionalNode.children,
                insideClientOnly ||
                  conditionalIsClientOnly ||
                  shouldWrapChain,
                insideMonoElement ||
                  conditionalIsMono,
              )
            }

            index = cursor
            continue
          }

          /*
           * v-else/v-else-if should normally have already been
           * processed with its preceding v-if chain.
           *
           * Do not wrap it independently because that would break
           * Vue's adjacency requirement.
           */
          if (
            hasDirective(node, 'else-if') ||
            hasDirective(node, 'else')
          ) {
            visitChildren(
              node.children,
              insideClientOnly || nodeIsClientOnly,
              insideMonoElement || nodeIsMono,
            )

            index++
            continue
          }

          const shouldWrap =
            nodeIsMono &&
            !insideClientOnly &&
            !insideMonoElement

          if (shouldWrap) {
            wrapRange(node, node)
          }

          visitChildren(
            node.children,
            insideClientOnly ||
              nodeIsClientOnly ||
              shouldWrap,
            insideMonoElement || nodeIsMono,
          )

          index++
        }
      }

      visitChildren(
        (ast as RootNode).children,
        false,
        false,
      )

      if (!changed) {
        return null
      }

      return {
        code: magicString.toString(),

        map: magicString.generateMap({
          source: filename,
          includeContent: true,
          hires: true,
        }),
      }
    },
  }
}
