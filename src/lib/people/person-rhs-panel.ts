/** RHS panel segment when a person is selected (People route). */
export type PersonRhsPanelView = "photos" | "faces";

export const PERSON_RHS_PANEL_STORAGE_KEY = "curator-people-rhs-panel-view";

export function readStoredPersonRhsPanelView():
  | PersonRhsPanelView
  | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(PERSON_RHS_PANEL_STORAGE_KEY);
    if (v === "photos" || v === "faces") return v;
  } catch {
    /* private mode, etc. */
  }
  return null;
}

export function writeStoredPersonRhsPanelView(view: PersonRhsPanelView) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PERSON_RHS_PANEL_STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}
