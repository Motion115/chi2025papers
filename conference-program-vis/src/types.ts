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
  authors: ShortAuthorsSpec[];
  award: string;
  shardId: number;
}

export interface ShortAuthorsSpec {
  personId: number;
  affiliations: AffiliationSpec[];
}

export type ContentLookupSpec = Record<string, ContentSpec>;

export interface AuthorSpec {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  middleInitial: string;
  affiliations: AffiliationSpec[];
  prevalence: number;
}

export interface AffiliationSpec {
  institution: string;
  dsl: string;
  geoLoc: string;
}

export type AuthorLookupSpec = Record<string, AuthorSpec>;

export interface EmbeddingSpec {
  id: number;
  tsne: number[];
  umap: number[];
  category: number;
}

export interface CircularSOMProps {
  data: SomSpec;
  contentLookup: ContentLookupSpec;
  searchId: string;
  setClicked: React.Dispatch<React.SetStateAction<string>>;
  trigger: number;
}

export interface DimReductionProps {
  data: EmbeddingSpec[];
  contentLookup: ContentLookupSpec;
  setClicked: React.Dispatch<React.SetStateAction<string>>;
  trigger: number;
}
