// A token is treated as an upper-case surname if it has 2+ letters, all upper case
function isUpperCaseWord(word) {
  const letters = word.replace(/[^\p{L}]/gu, "");
  return letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}

// Splits a raw name into first and last name. Supported formats:
//   "SMITH, John"        -> last: SMITH, first: John
//   "John Smith"         -> last: Smith, first: John
//   "SMITH John"         -> last: SMITH, first: John (upper-case word is the surname)
//   "John VAN DER BERG"  -> last: VAN DER BERG, first: John
// Comments in brackets, e.g. "(VIP)" or "[late]", are stripped out.
export function parseName(rawName) {
  const name = String(rawName ?? "")
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!name) return { firstName: null, lastName: null };

  // "LAST, First"
  if (name.includes(",")) {
    const [lastName, ...firstParts] = name.split(",");
    return {
      lastName: lastName.trim() || null,
      firstName: firstParts.join(" ").replace(/\s+/g, " ").trim() || null,
    };
  }

  const words = name.split(" ");
  if (words.length === 1) return { firstName: null, lastName: words[0] };

  // Mixed case: upper-case words are the surname, e.g. "SMITH John" or "John SMITH"
  const upperWords = words.filter(isUpperCaseWord);
  if (upperWords.length > 0 && upperWords.length < words.length) {
    return {
      lastName: upperWords.join(" "),
      firstName: words.filter((w) => !isUpperCaseWord(w)).join(" "),
    };
  }

  // "First [Middle] Last"
  return {
    lastName: words[words.length - 1],
    firstName: words.slice(0, -1).join(" "),
  };
}
