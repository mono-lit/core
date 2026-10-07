// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { customRemoteClause, searchEntryFor } from '../src/search/search-expr'
import { odataSearchExpr } from '../src/search/odata-search'

const metadata = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
  <edmx:DataServices>
    <Schema Namespace="Default" xmlns="http://docs.oasis-open.org/odata/ns/edm">
      <EntityType Name="SapPurchaseRequestDto">
        <Property Name="docNum" Type="Edm.Int32" Nullable="false" />
        <Property Name="docEntry" Type="Edm.Int64" Nullable="false" />
        <Property Name="requester" Type="Edm.String" Nullable="false" />
        <Property Name="department" Type="Edm.String" Nullable="false" />
        <Property Name="status" Type="Edm.String" Nullable="false" />
        <Property Name="comments" Type="Edm.String" Nullable="false" />
        <Property Name="docDate" Type="Edm.DateTimeOffset" />
      </EntityType>
      <Annotations Target="Default.SapPurchaseRequestDto/department">
        <Annotation Term="Mono.Search.CaseFold" Bool="false" />
      </Annotations>
      <Annotations Target="Default.SapPurchaseRequestDto/status">
        <Annotation Term="Mono.Search.CaseFold" Bool="false" />
      </Annotations>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`

const entries = () =>
  odataSearchExpr({
    metadata,
    entityType: 'Default.SapPurchaseRequestDto',
    fields: ['docNum', 'docEntry', 'requester', 'department', 'status', 'comments', 'docDate'],
  })

const clauseFor = (field: string, value: string) => {
  const entry = searchEntryFor(entries(), field)
  expect(entry).toBeDefined()
  expect(typeof entry).not.toBe('string')
  return customRemoteClause(entry as Exclude<typeof entry, string>, value, 'contains')
}

describe('odataSearchExpr', () => {
  it('routes a whole numeric term to an OData numeric equality', () => {
    expect(clauseFor('docNum', '2027260008')).toEqual(['docNum eq 2027260008'])
  })

  it('preserves a complete Int64 literal without JavaScript number rounding', () => {
    expect(clauseFor('docEntry', '9223372036854775807')).toEqual(['docEntry eq 9223372036854775807'])
  })

  it('does not coerce a non-numeric term into a numeric filter', () => {
    expect(clauseFor('docNum', 'PR-2027')).toBeNull()
  })

  it('case-folds ordinary string properties and escapes OData literals', () => {
    expect(clauseFor('requester', "O'Hara")).toEqual(["contains(tolower(requester),'o''hara')"])
    expect(clauseFor('comments', 'OPEN')).toEqual(["contains(tolower(comments),'open')"])
  })

  it('honours case-fold capability annotations on computed properties', () => {
    expect(clauseFor('department', 'Purchasing')).toEqual(["contains(department,'Purchasing')"])
    expect(clauseFor('status', 'Open')).toEqual(["contains(status,'Open')"])
  })

  it('omits unsupported OData types instead of issuing an invalid text predicate', () => {
    expect(searchEntryFor(entries(), 'docDate')).toBeUndefined()
  })

  it('resolves a qualified entity type in its declared namespace', () => {
    const sameNameMetadata = `<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx"><edmx:DataServices>
      <Schema Namespace="Sales" xmlns="http://docs.oasis-open.org/odata/ns/edm"><EntityType Name="Order"><Property Name="number" Type="Edm.Int32" /></EntityType></Schema>
      <Schema Namespace="Support" xmlns="http://docs.oasis-open.org/odata/ns/edm"><EntityType Name="Order"><Property Name="ticket" Type="Edm.String"><Annotation Term="Mono.Search.CaseFold" Bool="false" /></Property></EntityType></Schema>
    </edmx:DataServices></edmx:Edmx>`
    const entry = searchEntryFor(odataSearchExpr({
      metadata: sameNameMetadata,
      entityType: 'Support.Order',
      fields: ['ticket'],
    }), 'ticket')

    expect(customRemoteClause(entry as Exclude<typeof entry, string>, 'Open', 'contains')).toEqual(["contains(ticket,'Open')"])
  })

  it('inherits capabilities from a base entity property', () => {
    const inheritanceMetadata = `<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx"><edmx:DataServices>
      <Schema Namespace="Default" xmlns="http://docs.oasis-open.org/odata/ns/edm">
        <EntityType Name="Base"><Property Name="code" Type="Edm.String" /></EntityType>
        <EntityType Name="Child" BaseType="Default.Base" />
        <Annotations Target="Default.Base/code"><Annotation Term="Mono.Search.CaseFold" Bool="false" /></Annotations>
      </Schema>
    </edmx:DataServices></edmx:Edmx>`
    const entry = searchEntryFor(odataSearchExpr({
      metadata: inheritanceMetadata,
      entityType: 'Default.Child',
      fields: ['code'],
    }), 'code')

    expect(customRemoteClause(entry as Exclude<typeof entry, string>, 'ABC', 'contains')).toEqual(["contains(code,'ABC')"])
  })
})
