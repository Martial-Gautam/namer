export type NamePart = {
  label: "First name" | "Middle name" | "Last name";
  value: string;
  index: number;
};

export function splitName(fullName: string): NamePart[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return parts.map((value, index) => {
    if (index === 0) return { label: "First name", value, index };
    if (index === parts.length - 1) return { label: "Last name", value, index };
    return { label: "Middle name", value, index };
  });
}

export function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function nameFromMetadata(metadata: Record<string, unknown> | undefined) {
  const fullName =
    metadata?.full_name ||
    metadata?.name ||
    metadata?.user_name ||
    metadata?.preferred_username ||
    metadata?.login;

  return typeof fullName === "string" && fullName.trim() ? fullName.trim() : "Namer Friend";
}
