/** Coerces a Prisma `Json` value that's expected to hold a string array. */
export function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}
