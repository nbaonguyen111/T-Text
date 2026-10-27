import { describe, it, expect } from 'vitest'
import { Tokenizer } from './tokenizer'
import { parse } from './parser'
import { Heading, Paragraph, List, QuestionBlock, Text, Bold, Link } from './ast'

function parseSource(source: string) {
  const tok = new Tokenizer(source)
  const tokens = tok.tokenize()
  return parse(tokens)
}

describe('Parser', () => {
  it('parses empty document', () => {
    const { ast } = parseSource('')
    expect(ast.type).toBe('Document')
    expect(ast.children).toHaveLength(0)
  })

  it('parses heading level 1', () => {
    const { ast } = parseSource('= Tiêu đề')
    expect(ast.children).toHaveLength(1)
    const h = ast.children[0] as Heading
    expect(h.type).toBe('Heading')
    expect(h.level).toBe(1)
    expect(h.children[0].type).toBe('Text')
    expect((h.children[0] as Text).value).toBe(' Tiêu đề')
  })

  it('parses heading level 3', () => {
    const { ast } = parseSource('=== Tiêu đề cấp 3')
    const h = ast.children[0] as Heading
    expect(h.type).toBe('Heading')
    expect(h.level).toBe(3)
  })

  it('parses paragraph', () => {
    const { ast } = parseSource('Đây là đoạn văn bình thường.')
    expect(ast.children).toHaveLength(1)
    const p = ast.children[0] as Paragraph
    expect(p.type).toBe('Paragraph')
    expect(p.children[0].type).toBe('Text')
    expect((p.children[0] as Text).value).toBe('Đây là đoạn văn bình thường.')
  })

  it('parses bold text', () => {
    const { ast } = parseSource("'''đậm''' văn bản")
    const p = ast.children[0] as Paragraph
    expect(p.children[0].type).toBe('Bold')
    expect((p.children[0] as Bold).children[0].type).toBe('Text')
    expect(((p.children[0] as Bold).children[0] as Text).value).toBe('đậm')
  })

  it('parses italic text', () => {
    const { ast } = parseSource("''nghiên'' văn bản")
    const p = ast.children[0] as Paragraph
    expect(p.children[0].type).toBe('Italic')
  })

  it('parses unordered list', () => {
    const { ast } = parseSource('* Mục 1\n* Mục 2')
    expect(ast.children).toHaveLength(1)
    const list = ast.children[0] as List
    expect(list.type).toBe('List')
    expect(list.ordered).toBe(false)
    expect(list.items).toHaveLength(2)
  })

  it('parses ordered list', () => {
    const { ast } = parseSource('# Mục 1\n# Mục 2')
    const list = ast.children[0] as List
    expect(list.type).toBe('List')
    expect(list.ordered).toBe(true)
    expect(list.items).toHaveLength(2)
  })

  it('parses ordered list with numbers', () => {
    const { ast } = parseSource('1. Mục 1\n2. Mục 2')
    const list = ast.children[0] as List
    expect(list.type).toBe('List')
    expect(list.ordered).toBe(true)
  })

  it('parses theory block', () => {
    const { ast } = parseSource('<lythuyet>Nội dung lý thuyết</lythuyet>')
    expect(ast.children).toHaveLength(1)
    const block = ast.children[0]
    expect(block.type).toBe('TheoryBlock')
  })

  it('parses example block', () => {
    const { ast } = parseSource('<vidu>Nội dung ví dụ</vidu>')
    const block = ast.children[0]
    expect(block.type).toBe('ExampleBlock')
  })

  it('parses question block with answer and solution', () => {
    const source = '<cauhoi id="C1" loai="trac-nghiem">Nội dung câu hỏi<dapan>B</dapan><loigiai>Giải thích</loigiai></cauhoi>'
    const { ast, diagnostics } = parseSource(source)
    expect(ast.children).toHaveLength(1)
    const q = ast.children[0] as QuestionBlock
    expect(q.type).toBe('QuestionBlock')
    expect(q.id).toBe('C1')
    expect(q.loai).toBe('trac-nghiem')
    expect(q.answer).toBeDefined()
    expect(q.solution).toBeDefined()
    expect(diagnostics).toHaveLength(0)
  })

  it('parses internal link', () => {
    const { ast } = parseSource('[[bai_toan_1]]')
    const p = ast.children[0] as Paragraph
    expect(p.children[0].type).toBe('Link')
    expect((p.children[0] as Link).href).toBe('bai_toan_1')
  })

  it('parses internal link with label', () => {
    const { ast } = parseSource('[[bai_toan_1|Xem bài toán]]')
    const p = ast.children[0] as Paragraph
    expect(p.children[0].type).toBe('Link')
    expect((p.children[0] as Link).href).toBe('bai_toan_1')
    expect(((p.children[0] as Link).children[0] as Text).value).toBe('Xem bài toán')
  })

  it('reports missing id on question', () => {
    const { diagnostics } = parseSource('<cauhoi loai="trac-nghiem">Nội dung</cauhoi>')
    expect(diagnostics.length).toBeGreaterThan(0)
    expect(diagnostics[0].code).toBe('MISSING_QUESTION_ID')
  })

  it('handles multiple blocks', () => {
    const source = '= Title\n\nPara 1.\n\n* Item 1\n* Item 2\n\n<lythuyet>Lý thuyết</lythuyet>'
    const { ast } = parseSource(source)
    expect(ast.children.length).toBeGreaterThanOrEqual(3)
  })
})