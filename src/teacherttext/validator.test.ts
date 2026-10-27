import { describe, it, expect } from 'vitest'
import { Tokenizer } from './tokenizer'
import { parse } from './parser'
import { validate, validateText } from './validator'

function parseAndValidate(source: string) {
  const tok = new Tokenizer(source)
  const tokens = tok.tokenize()
  const { ast } = parse(tokens)
  return validate(ast)
}

describe('Validator', () => {
  it('validates empty document', () => {
    const diagnostics = parseAndValidate('')
    expect(diagnostics).toHaveLength(0)
  })

  it('validates well-formed document', () => {
    const source = '= Title\n\nParagraph text.\n\n<lythuyet>Content</lythuyet>'
    const diagnostics = parseAndValidate(source)
    expect(diagnostics).toHaveLength(0)
  })

  it('detects missing question id', () => {
    const source = '<cauhoi loai="trac-nghiem">Content</cauhoi>'
    const diagnostics = parseAndValidate(source)
    expect(diagnostics.length).toBeGreaterThan(0)
    expect(diagnostics.some(d => d.code === 'MISSING_QUESTION_ID')).toBe(true)
  })

  it('validates question with id', () => {
    const source = '<cauhoi id="C1" loai="trac-nghiem">Content</cauhoi>'
    const diagnostics = parseAndValidate(source)
    expect(diagnostics).toHaveLength(0)
  })

  it('validateText detects unclosed tags', () => {
    const result = validateText('<lythuyet>content</vidu>')
    expect(result.valid).toBe(false)
    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('validateText accepts well-formed tags', () => {
    const result = validateText('<lythuyet>content</lythuyet>')
    expect(result.valid).toBe(true)
  })
})