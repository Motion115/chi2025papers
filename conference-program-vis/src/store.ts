import { create } from 'zustand'
import { AuthorLookupSpec, ContentLookupSpec, SomSpec } from './types'

interface ContentLookupState {
  contentLookup: ContentLookupSpec | null;
  setContentLookup: (contentLookup: ContentLookupSpec) => void;
}

export const useContentLookup = create<ContentLookupState>((set) => ({
  contentLookup: null,
  setContentLookup: (contentLookup: ContentLookupSpec) =>
    set({ contentLookup }),
}));

interface AuthorLookupState {
  authorLookup: AuthorLookupSpec | null;
  setAuthorLookup: (authorLookup: AuthorLookupSpec) => void;
}

export const useAuthorLookup = create<AuthorLookupState>((set) => ({
  authorLookup: null,
  setAuthorLookup: (authorLookup: AuthorLookupSpec) =>
    set({ authorLookup }),
}))

interface RelationshipLookupState {
  relationshipLookup: SomSpec[] | null;
  setRelationshipLookup: (relationshipLookup: SomSpec[]) => void;
  appendRelationshipLookup: (relationshipLookup: SomSpec[]) => void;
}

export const useRelationshipLookup = create<RelationshipLookupState>((set) => ({
  relationshipLookup: null,
  setRelationshipLookup: (relationshipLookup: SomSpec[]) =>
    set({ relationshipLookup }),
  appendRelationshipLookup: (newItems: SomSpec[]) =>
    set((state) => ({
      relationshipLookup: state.relationshipLookup
        ? [...state.relationshipLookup, ...newItems]
        : newItems,
    })),
}));