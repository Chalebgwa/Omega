const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeUrl(rawUrl: string): string | null {
  const candidate = rawUrl.trim()
  if (!candidate) return null

  if (candidate.startsWith('/')) {
    return candidate
  }

  try {
    const parsed = new URL(candidate)
    if (!LINK_PROTOCOLS.has(parsed.protocol)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

function formatInlineMarkup(value: string): string {
  return value
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
}

function renderInline(value: string): string {
  const stashed: Array<{ token: string; html: string }> = []

  const stash = (html: string): string => {
    const token = `MARKUPTOKEN${stashed.length}MARKUP`
    stashed.push({ token, html })
    return token
  }

  let output = value

  output = output.replace(/`([^`]+)`/g, (_match, code: string) => {
    return stash(`<code>${escapeHtml(code)}</code>`)
  })

  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label: string, rawUrl: string) => {
    const safeUrl = sanitizeUrl(rawUrl)
    if (!safeUrl) {
      return label
    }

    const safeLabel = formatInlineMarkup(escapeHtml(label))
    return stash(
      `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`,
    )
  })

  output = formatInlineMarkup(escapeHtml(output))

  stashed.forEach(({ token, html }) => {
    output = output.replaceAll(token, html)
  })

  return output
}

export function renderMarkupToHtml(markup: string): string {
  const source = markup.trim()
  if (!source) return '<p>Nothing here yet.</p>'

  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const chunks: string[] = []
  let activeList: 'ul' | 'ol' | null = null
  let inCodeFence = false
  let fencedCode: string[] = []

  const closeList = () => {
    if (!activeList) return
    chunks.push(`</${activeList}>`)
    activeList = null
  }

  const openList = (type: 'ul' | 'ol') => {
    if (activeList === type) return
    closeList()
    chunks.push(`<${type}>`)
    activeList = type
  }

  const flushCodeFence = () => {
    if (fencedCode.length === 0) {
      chunks.push('<pre><code></code></pre>')
    } else {
      chunks.push(`<pre><code>${escapeHtml(fencedCode.join('\n'))}</code></pre>`)
    }
    fencedCode = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      closeList()
      if (inCodeFence) {
        flushCodeFence()
        inCodeFence = false
      } else {
        inCodeFence = true
        fencedCode = []
      }
      continue
    }

    if (inCodeFence) {
      fencedCode.push(line)
      continue
    }

    if (!trimmed) {
      closeList()
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      chunks.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`)
      continue
    }

    const unorderedListMatch = trimmed.match(/^[-*+]\s+(.+)$/)
    if (unorderedListMatch) {
      openList('ul')
      chunks.push(`<li>${renderInline(unorderedListMatch[1])}</li>`)
      continue
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (orderedListMatch) {
      openList('ol')
      chunks.push(`<li>${renderInline(orderedListMatch[1])}</li>`)
      continue
    }

    const quoteMatch = trimmed.match(/^>\s?(.+)$/)
    if (quoteMatch) {
      closeList()
      chunks.push(`<blockquote>${renderInline(quoteMatch[1])}</blockquote>`)
      continue
    }

    closeList()
    chunks.push(`<p>${renderInline(trimmed)}</p>`)
  }

  if (inCodeFence) {
    closeList()
    flushCodeFence()
  } else {
    closeList()
  }

  return chunks.join('')
}
