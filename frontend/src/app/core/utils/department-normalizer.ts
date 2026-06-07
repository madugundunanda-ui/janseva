// Normalizes AI‑provided department strings to the canonical department names used in the UI.
// This utility is essential for mapping AI responses to a valid department ID.
// Add aliases here as the AI model evolves.
export const normalizeDepartment = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  const map: Record<string, string> = {
    'Electrical': 'Electricity',
    'Power Supply': 'Electricity',
    'Roads & Transport': 'Roads & Highways',
    // add more alias→canonical pairs as needed
  };
  // Direct alias match (case‑insensitive)
  const key = trimmed.toLowerCase();
  for (const [alias, canonical] of Object.entries(map)) {
    if (alias.toLowerCase() === key) return canonical;
  }
  // If it already matches a known department name, return it unchanged
  const known = [
    'Roads & Highways',
    'Water Supply',
    'Electricity',
    'Sanitation',
    'Public Health',
    'Revenue',
    'Transport',
    'Smart City Operations',
    'Rural Development',
    'Emergency Response'
  ];
  const found = known.find(d => d.toLowerCase() === key);
  return found ?? trimmed; // fallback to original string if unknown
};
