import { AstNode, Document, Block, QuestionBlock } from './ast'
import { Diagnostic, createDiagnostic } from './diagnostics'

const VALID_BLOCK_TYPES = new Set([
  'Heading', 'Paragraph', 'List', 'TheoryBlock', 'ExampleBlock', 'QuestionBlock', 'HorizontalRule',
])

const VALID_INLINE_TYPES = new Set([
  'Text', 'Bold', 'Italic', 'Link', 'MathInline', 'MathBlock', 'LineBreak',
])

export function validate(ast: Document): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  validateNode(ast, diagnostics, 0)
  return diagnostics
}

function validateNode(node: AstNode, diagnostics: Diagnostic[], depth: number): void {
  if (depth > 100) {
    diagnostics.push(createDiagnostic(
      'error', 'AST_TOO_DEEP',
      'Cây AST quá sâu, có thể có vòng lặp',
      node.loc.start.line, node.loc.start.column,
    ))
    return
  }

  if (node.type === 'Document') {
    const doc = node as Document
    for (const child of doc.children) {
      validateNode(child, diagnostics, depth + 1)
    }
    return
  }

  if (!VALID_BLOCK_TYPES.has(node.type) && !VALID_INLINE_TYPES.has(node.type)) {
    diagnostics.push(createDiagnostic(
      'error', 'UNKNOWN_NODE_TYPE',
      `Loại nút không xác định: ${node.type}`,
      node.loc.start.line, node.loc.start.column,
    ))
  }

  // Validate QuestionBlock
  if (node.type === 'QuestionBlock') {
    const q = node as QuestionBlock
    if (!q.id) {
      diagnostics.push(createDiagnostic(
        'error', 'MISSING_QUESTION_ID',
        'Câu hỏi thiếu thuộc tính id',
        q.loc.start.line, q.loc.start.column,
      ))
    }
    if (!q.loai) {
      diagnostics.push(createDiagnostic(
        'warning', 'MISSING_QUESTION_TYPE',
        'Câu hỏi nên có thuộc tính loai',
        q.loc.start.line, q.loc.start.column,
      ))
    }
  }

  // Recursively validate children
  const block = node as Block & { children?: AstNode[] }
  if (block.children) {
    for (const child of block.children) {
      validateNode(child, diagnostics, depth + 1)
    }
  }
}

export function validateText(input: string): { valid: boolean; diagnostics: Diagnostic[] } {
  // Lightweight validation without full parse
  const diagnostics: Diagnostic[] = []
  const lines = input.split('\n')

  // Check for unclosed tags
  const openTags: string[] = []
  const tagRegex = /<\/?([a-z]+)[^>]*>/g

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let match
    while ((match = tagRegex.exec(line)) !== null) {
      const tagName = match[1]
      const isClosing = match[0].startsWith('</')

      if (isClosing) {
        const lastOpen = openTags.pop()
        if (lastOpen !== tagName) {
          diagnostics.push(createDiagnostic(
            'error', 'UNMATCHED_CLOSE_TAG',
            `Thẻ đóng </${tagName}> không khớp với thẻ mở <${lastOpen}>`,
            i + 1, match.index + 1,
          ))
        }
      } else {
        openTags.push(tagName)
      }
    }
  }

  for (const tag of openTags) {
    diagnostics.push(createDiagnostic(
      'error', 'UNCLOSED_TAG',
      `Thẻ <${tag}> chưa được đóng`,
      1, 1,
    ))
  }

  return { valid: diagnostics.length === 0, diagnostics }
}