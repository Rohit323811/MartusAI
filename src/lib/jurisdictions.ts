export interface Jurisdiction {
  id: string;
  name: string;
  scope: "state" | "federal";
}

/**
 * Phase 1 demo scope: US federal + California.
 * Brief allows 1 country / 2–3 states; more land with Phase 2 real data.
 */
export const JURISDICTIONS: Jurisdiction[] = [
  { id: "us-fed", name: "United States (Federal)", scope: "federal" },
  { id: "us-ca", name: "California", scope: "state" },
  { id: "us-unknown", name: "Jurisdiction unknown", scope: "state" },
];

export function isSupported(id: string): boolean {
  return JURISDICTIONS.some((j) => j.id === id);
}
