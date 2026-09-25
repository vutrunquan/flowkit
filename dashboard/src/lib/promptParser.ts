/**
 * Intelligent prompt parser utility for FlowKit.
 * Supports:
 * - Numbered scenes: "1. Prompt...", "2) Prompt...", "[Scene 1] Prompt..."
 * - Section headers: "### Scene 1", "Cảnh 1:", "Scene 1:"
 * - Double newline separated blocks
 * - Line-by-line fallback
 */

export interface ParsedSceneItem {
  index: number
  prompt: string
  wordCount: number
  characterMentions: string[]
}

export function parsePrompts(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return []

  const text = rawText.trim()

  // Pattern for numbered scene starters at beginning of line:
  // e.g. "1. ", "2) ", "Scene 1:", "Cảnh 1:", "### Scene 1", "[Scene 1]"
  const sceneHeaderRegex = /(?:^|\n)(?=(?:(?:\d{1,3}[\.\)])|(?:Scene\s*\d{1,3}[:\.\-]?)|(?:Cảnh\s*\d{1,3}[:\.\-]?)|(?:###\s*(?:Scene|Cảnh)?\s*\d{1,3}[:\.\-]?)|(?:\[Scene\s*\d{1,3}\]))\s+)/i

  let chunks: string[] = []

  // Check if text has multiple scene headers
  const headerMatches = text.match(/(?:^|\n)(?:(?:\d{1,3}[\.\)])|(?:Scene\s*\d{1,3}[:\.\-]?)|(?:Cảnh\s*\d{1,3}[:\.\-]?)|(?:###\s*(?:Scene|Cảnh)?\s*\d{1,3}[:\.\-]?)|(?:\[Scene\s*\d{1,3}\]))\s+/gi)

  if (headerMatches && headerMatches.length > 1) {
    // Split by lookahead scene headers
    chunks = text.split(sceneHeaderRegex)
  } else if (text.includes('\n\n')) {
    // Split by double line breaks (paragraphs)
    chunks = text.split(/\n\s*\n+/)
  } else {
    // Fall back to line by line
    chunks = text.split(/\r?\n/)
  }

  // Clean each chunk
  const cleaned: string[] = []

  for (const chunk of chunks) {
    const trimmed = chunk.trim()
    if (!trimmed) continue

    // Strip leading header/number: e.g. "1. ", "2) ", "Scene 1: ", "[Scene 1] ", "### Cảnh 1: "
    const stripped = trimmed
      .replace(/^(?:(?:\d{1,3}[\.\)])|(?:Scene\s*\d{1,3}[:\.\-]?)|(?:Cảnh\s*\d{1,3}[:\.\-]?)|(?:###\s*(?:Scene|Cảnh)?\s*\d{1,3}[:\.\-]?)|(?:\[Scene\s*\d{1,3}\]))\s*/i, '')
      .trim()

    if (stripped.length > 0) {
      cleaned.push(stripped)
    }
  }

  return cleaned
}

export function analyzeParsedPrompts(prompts: string[]): ParsedSceneItem[] {
  return prompts.map((prompt, idx) => {
    const words = prompt.trim().split(/\s+/).filter(Boolean)
    
    // Simple entity detection (capitalized words or common character markers)
    const entityMatches = prompt.match(/\b([A-Z][a-z0-9_-]{2,})\b/g) || []
    const uniqueEntities = Array.from(new Set(entityMatches)).filter(
      w => !['The', 'And', 'With', 'From', 'Style', 'Wide', 'Close', 'Medium', 'Shot', 'Camera', 'Composition', 'Real', 'Light', 'Studio'].includes(w)
    )

    return {
      index: idx + 1,
      prompt,
      wordCount: words.length,
      characterMentions: uniqueEntities.slice(0, 4),
    }
  })
}
