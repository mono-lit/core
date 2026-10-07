import type { MonoSearchExpr, MonoSearchExprEntry } from './search-expr.js'

/** Metadata and selected properties used to compile a safe remote OData search. */
export interface MonoODataSearchOptions {
  /** CSDL returned by the service's `$metadata` endpoint. */
  metadata: string | XMLDocument
  /** Fully qualified EDM type (`Default.Customer`) or its short name (`Customer`). */
  entityType: string
  /** Properties made available to the search box, in display order. */
  fields: readonly string[]
}

const INTEGER_TYPES: Record<string, true> = {
  'Edm.Byte': true,
  'Edm.SByte': true,
  'Edm.Int16': true,
  'Edm.Int32': true,
  'Edm.Int64': true,
}

const DECIMAL_TYPES: Record<string, true> = {
  'Edm.Decimal': true,
  'Edm.Double': true,
  'Edm.Single': true,
}
const CASE_FOLD_TERM = 'Mono.Search.CaseFold'

function childElements(element: Element, name: string): Element[] {
  return Array.from(element.children).filter((child) => child.localName === name)
}

function metadataDocument(metadata: string | XMLDocument): XMLDocument {
  if (typeof metadata !== 'string') return metadata
  if (typeof DOMParser === 'undefined') {
    throw new Error('odataSearchExpr requires DOMParser when metadata is XML text.')
  }
  const document = new DOMParser().parseFromString(metadata, 'application/xml')
  if (document.querySelector('parsererror')) throw new Error('odataSearchExpr received invalid OData metadata.')
  return document
}

function entityTypeOf(document: XMLDocument, requested: string): Element | null {
  const separator = requested.lastIndexOf('.')
  const namespace = separator < 0 ? null : requested.slice(0, separator)
  const name = separator < 0 ? requested : requested.slice(separator + 1)
  return Array.from(document.getElementsByTagNameNS('*', 'EntityType')).find(
    (entity) =>
      entity.getAttribute('Name') === name &&
      (!namespace || entity.parentElement?.getAttribute('Namespace') === namespace),
  ) ?? null
}

function odataLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function caseFoldEnabled(document: XMLDocument, entity: Element, field: string): boolean {
  const inline = childElements(
    childElements(entity, 'Property').find((property) => property.getAttribute('Name') === field) ?? entity,
    'Annotation',
  )
  const entityName = entity.getAttribute('Name')
  const namespace = entity.parentElement?.getAttribute('Namespace')
  const target = namespace && entityName ? `${namespace}.${entityName}/${field}` : null
  const external = target
    ? Array.from(document.getElementsByTagNameNS('*', 'Annotations'))
        .filter((annotations) => annotations.getAttribute('Target') === target)
        .flatMap((annotations) => childElements(annotations, 'Annotation'))
    : []
  const annotation = [...inline, ...external].find(
    (candidate) => candidate.getAttribute('Term') === CASE_FOLD_TERM,
  )
  return annotation?.getAttribute('Bool') !== 'false'
}

function numericClause(field: string, type: string, value: string): string | null {
  const literal = value.trim()
  if (INTEGER_TYPES[type] && /^[+-]?\d+$/.test(literal)) return `${field} eq ${literal}`
  if (DECIMAL_TYPES[type] && /^[+-]?(?:\d+|\d*\.\d+)$/.test(literal)) return `${field} eq ${literal}`
  return null
}

/**
 * Compile selected CSDL properties into the grid's existing `searchExpr` contract.
 *
 * Strings retain case-insensitive matching unless the service annotates the property
 * with `Mono.Search.CaseFold=false`; numeric EDM properties accept a complete numeric
 * input as equality. Unsupported EDM types do not generate invalid text predicates.
 */
export function odataSearchExpr(options: MonoODataSearchOptions): MonoSearchExpr {
  const document = metadataDocument(options.metadata)
  const entity = entityTypeOf(document, options.entityType)
  if (!entity) {
    throw new Error(`odataSearchExpr could not find entity type "${options.entityType}" in metadata.`)
  }

  const properties = new Map<string, { property: Element; owner: Element }>()
  let owner: Element | null = entity
  while (owner) {
    for (const property of childElements(owner, 'Property')) {
      const name = property.getAttribute('Name')
      if (name && !properties.has(name)) properties.set(name, { property, owner })
    }
    const baseType = owner.getAttribute('BaseType')
    owner = baseType ? entityTypeOf(document, baseType) : null
  }
  const entries: MonoSearchExprEntry[] = []

  for (const field of options.fields) {
    const entry = properties.get(field)
    const type = entry?.property.getAttribute('Type')
    if (!entry || !type) continue

    if (type === 'Edm.String') {
      const fold = caseFoldEnabled(document, entry.owner, field)
      entries.push({
        field,
        custom: ({ value, operation }) => {
          if (operation !== 'contains') return null
          const literal = odataLiteral(fold ? value.toLocaleLowerCase() : value)
          return fold ? `contains(tolower(${field}),${literal})` : `contains(${field},${literal})`
        },
      })
      continue
    }

    if (INTEGER_TYPES[type] || DECIMAL_TYPES[type]) {
      entries.push({
        field,
        custom: ({ value, operation }) => (operation === 'contains' ? numericClause(field, type, value) : null),
      })
    }
  }

  return entries
}
