/**
 * Lulu print-job cost API accepts only these US state_code values (see API errors).
 */
export const LULU_US_STATE_CODES = new Set([
  "AL", "AK", "AS", "AZ", "AR", "AA", "AE", "AP", "CA", "CO", "CT", "DE", "DC",
  "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MH",
  "MD", "MA", "MI", "FM", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "MP", "OH", "OK", "OR", "PW", "PA", "PR", "RI", "SC", "SD",
  "TN", "TX", "UT", "VT", "VI", "VA", "WA", "WV", "WI", "WY",
]);

/** Lowercase keys: full names and common variants → Lulu state_code */
const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  "american samoa": "AS",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  "district of columbia": "DC",
  florida: "FL",
  georgia: "GA",
  guam: "GU",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "puerto rico": "PR",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "armed forces americas": "AA",
  "armed forces europe": "AE",
  "armed forces pacific": "AP",
  "northern mariana islands": "MP",
  "u.s. virgin islands": "VI",
  "us virgin islands": "VI",
  "virgin islands": "VI",
  "marshall islands": "MH",
  "federated states of micronesia": "FM",
  palau: "PW",
  "washington dc": "DC",
  "washington d.c.": "DC",
  "d.c.": "DC",
  dc: "DC",
};

/**
 * Returns a Lulu-valid US state_code, or null if the value cannot be resolved.
 */
export function normalizeUsStateCodeForLulu(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && LULU_US_STATE_CODES.has(upper)) {
    return upper;
  }

  const key = trimmed.toLowerCase();
  const fromName = US_STATE_NAME_TO_CODE[key];
  if (fromName && LULU_US_STATE_CODES.has(fromName)) {
    return fromName;
  }

  return null;
}
