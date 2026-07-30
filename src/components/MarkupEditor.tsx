import { useRef, useState } from 'react'
import { renderMarkupToHtml } from '../lib/markup'

type EditorMode = 'write' | 'preview'

interface MarkupEditorProps {
  id: string
  label: string
  value: string
  onChange: (nextValue: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
  helperText?: string
}

interface TransformResult {
  value: string
  selectionStart: number
  selectionEnd: number
}

type ToolAction = (value: string, selectionStart: number, selectionEnd: number) => TransformResult

function replaceSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertedText: string,
  selectedRange?: { start: number; end: number },
): TransformResult {
  const nextValue = value.slice(0, selectionStart) + insertedText + value.slice(selectionEnd)
  if (!selectedRange) {
    const cursor = selectionStart + insertedText.length
    return { value: nextValue, selectionStart: cursor, selectionEnd: cursor }
  }

  return {
    value: nextValue,
    selectionStart: selectionStart + selectedRange.start,
    selectionEnd: selectionStart + selectedRange.end,
  }
}

function wrapSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  suffix: string,
  placeholder: string,
): TransformResult {
  const hasSelection = selectionStart !== selectionEnd
  const selectedText = value.slice(selectionStart, selectionEnd)
  const content = hasSelection ? selectedText : placeholder
  const inserted = `${prefix}${content}${suffix}`

  return replaceSelection(value, selectionStart, selectionEnd, inserted, {
    start: prefix.length,
    end: prefix.length + content.length,
  })
}

function prefixSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  prefix: string,
  placeholder: string,
): TransformResult {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lineEndIndex = value.indexOf('\n', selectionEnd)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  const selectedLines = value.slice(lineStart, lineEnd)

  if (!selectedLines && selectionStart === selectionEnd) {
    const inserted = `${prefix}${placeholder}`
    return replaceSelection(value, lineStart, lineEnd, inserted, {
      start: prefix.length,
      end: prefix.length + placeholder.length,
    })
  }

  const transformedLines = selectedLines
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n')

  return replaceSelection(value, lineStart, lineEnd, transformedLines, {
    start: 0,
    end: transformedLines.length,
  })
}

function numberSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  placeholder: string,
): TransformResult {
  const lineStart = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1
  const lineEndIndex = value.indexOf('\n', selectionEnd)
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
  const selectedLines = value.slice(lineStart, lineEnd)

  if (!selectedLines && selectionStart === selectionEnd) {
    const inserted = `1. ${placeholder}`
    return replaceSelection(value, lineStart, lineEnd, inserted, {
      start: 3,
      end: 3 + placeholder.length,
    })
  }

  const transformedLines = selectedLines
    .split('\n')
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n')

  return replaceSelection(value, lineStart, lineEnd, transformedLines, {
    start: 0,
    end: transformedLines.length,
  })
}

function insertLink(value: string, selectionStart: number, selectionEnd: number): TransformResult {
  const selectedText = value.slice(selectionStart, selectionEnd)
  const linkText = selectedText || 'link text'
  const url = 'https://example.com'
  const inserted = `[${linkText}](${url})`
  const urlStart = linkText.length + 3

  return replaceSelection(value, selectionStart, selectionEnd, inserted, {
    start: urlStart,
    end: urlStart + url.length,
  })
}

function insertCodeFence(value: string, selectionStart: number, selectionEnd: number): TransformResult {
  const selectedText = value.slice(selectionStart, selectionEnd)
  const content = selectedText || 'code here'
  const inserted = `\`\`\`\n${content}\n\`\`\``

  return replaceSelection(value, selectionStart, selectionEnd, inserted, {
    start: 4,
    end: 4 + content.length,
  })
}

const TOOLS: Array<{ id: string; label: string; ariaLabel: string; action: ToolAction }> = [
  {
    id: 'heading',
    label: 'H1',
    ariaLabel: 'Insert heading',
    action: (value, selectionStart, selectionEnd) => prefixSelectedLines(value, selectionStart, selectionEnd, '# ', 'Heading'),
  },
  {
    id: 'bold',
    label: 'Bold',
    ariaLabel: 'Bold selected text',
    action: (value, selectionStart, selectionEnd) => wrapSelection(value, selectionStart, selectionEnd, '**', '**', 'bold text'),
  },
  {
    id: 'italic',
    label: 'Italic',
    ariaLabel: 'Italicize selected text',
    action: (value, selectionStart, selectionEnd) => wrapSelection(value, selectionStart, selectionEnd, '*', '*', 'italic text'),
  },
  {
    id: 'link',
    label: 'Link',
    ariaLabel: 'Insert link',
    action: insertLink,
  },
  {
    id: 'quote',
    label: 'Quote',
    ariaLabel: 'Insert block quote',
    action: (value, selectionStart, selectionEnd) => prefixSelectedLines(value, selectionStart, selectionEnd, '> ', 'Quoted text'),
  },
  {
    id: 'bullets',
    label: 'Bullets',
    ariaLabel: 'Insert bulleted list',
    action: (value, selectionStart, selectionEnd) => prefixSelectedLines(value, selectionStart, selectionEnd, '- ', 'List item'),
  },
  {
    id: 'numbers',
    label: 'Numbered',
    ariaLabel: 'Insert numbered list',
    action: (value, selectionStart, selectionEnd) => numberSelectedLines(value, selectionStart, selectionEnd, 'List item'),
  },
  {
    id: 'inline-code',
    label: 'Code',
    ariaLabel: 'Insert inline code',
    action: (value, selectionStart, selectionEnd) => wrapSelection(value, selectionStart, selectionEnd, '`', '`', 'code'),
  },
  {
    id: 'code-block',
    label: 'Code Block',
    ariaLabel: 'Insert code block',
    action: insertCodeFence,
  },
]

export function MarkupEditor({
  id,
  label,
  value,
  onChange,
  placeholder = 'Write your post here...',
  required = false,
  rows = 10,
  helperText = 'Markup supported: headings (#), bold (**text**), italics (*text*), links, lists, blockquotes, and code.',
}: MarkupEditorProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>('write')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const applyTool = (action: ToolAction) => {
    if (editorMode !== 'write') {
      setEditorMode('write')
    }

    const textarea = textareaRef.current
    if (!textarea) return

    const next = action(value, textarea.selectionStart, textarea.selectionEnd)
    onChange(next.value)

    requestAnimationFrame(() => {
      const input = textareaRef.current
      if (!input) return
      input.focus()
      input.setSelectionRange(next.selectionStart, next.selectionEnd)
    })
  }

  return (
    <div className="field">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id}>{label}</label>
        <div className="tab-row" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            className={`tab-btn ${editorMode === 'write' ? 'active' : ''}`}
            onClick={() => setEditorMode('write')}
          >
            Write
          </button>
          <button
            type="button"
            className={`tab-btn ${editorMode === 'preview' ? 'active' : ''}`}
            onClick={() => setEditorMode('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      {editorMode === 'write' ? (
        <>
          <div className="editor-toolbar" role="toolbar" aria-label="Text formatting tools">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="editor-tool"
                aria-label={tool.ariaLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyTool(tool.action)}
              >
                {tool.label}
              </button>
            ))}
          </div>

          <textarea
            id={id}
            ref={textareaRef}
            required={required}
            rows={rows}
            className="textarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        </>
      ) : (
        <div className="markup-preview">
          <div className="markup-content" dangerouslySetInnerHTML={{ __html: renderMarkupToHtml(value) }} />
        </div>
      )}

      <p className="field-help">{helperText}</p>
    </div>
  )
}
