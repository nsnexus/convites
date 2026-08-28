/** "maria-e-joao" -> "Maria e Joao". Usado sempre que o slug vira nome de exibição. */
export function formatCoupleName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word === "e" ? "e" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}
