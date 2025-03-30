export interface SomSpec {
  id: number;
  relationship: RelationshipSpec[];
}

export interface RelationshipSpec {
  category: number;
  circularPos: [number, number];
  id: number;
  relevance: number;
}

export interface ContentSpec {
  sessionId: number[];
  title: string;
  trackId: number;
  typeId: number;
  abstract: string;
  authors: number[];
  award: string;
}

export type ContentLookupSpec = Record<string, ContentSpec>

export interface AuthorSpec {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  affiliations: AffiliationSpec[];
}

export interface AffiliationSpec {
  institution: string;
  dsl: string;
  geoLoc: string;
}

export type AuthorLookupSpec = Record<string, AuthorSpec>
