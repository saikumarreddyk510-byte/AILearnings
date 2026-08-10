/**
 * Cheap, deterministic (non-AI) heuristics to pre-populate a starting
 * CONTACT fact from extracted text, so the user edits/confirms something
 * instead of starting from a blank form. Always created with
 * `verified: false` — this is a starting guess, never presented as fact.
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_PATTERN = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

export interface DerivedContact {
  email?: string;
  phone?: string;
}

export function deriveContactFromText(text: string): DerivedContact {
  const email = text.match(EMAIL_PATTERN)?.[0];
  const phone = text.match(PHONE_PATTERN)?.[0];

  const result: DerivedContact = {};
  if (email) result.email = email;
  if (phone) result.phone = phone.trim();
  return result;
}
