/**
 * Coincidencia difusa simple para la paleta de comandos (⌘K): cada letra de
 * `query`, en orden, debe aparecer en `text` (no necesariamente contigua).
 * Entre más juntas y más al inicio aparezcan las letras, menor (mejor) el
 * puntaje. `null` significa que no hay coincidencia.
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.trim().toLowerCase()
  const t = text.toLowerCase()
  if (!q) return 0

  let score = 0
  let lastIndex = -1
  for (const char of q) {
    const index = t.indexOf(char, lastIndex + 1)
    if (index === -1) return null
    // Penaliza el hueco entre coincidencias; coincidencias contiguas no
    // suman nada extra.
    score += lastIndex === -1 ? index : index - lastIndex - 1
    lastIndex = index
  }
  return score
}
