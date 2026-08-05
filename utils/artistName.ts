/**
 * The `artists` table and `gallery_items` table don't always spell an
 * artist's name identically (e.g. a middle name in one but not the other),
 * so anything matching an artist across the two data sources — a deep link,
 * a form selection — compares first + last name tokens instead of requiring
 * an exact string match.
 */
export function artistNameKey(value: string) {
  const words = value.trim().toLowerCase().split(/[\s-]+/).filter(Boolean)
  if (words.length === 0) return ''
  return `${words[0]} ${words[words.length - 1]}`
}
