import { describe, it, expect } from 'vitest'
import { Tokenizer } from './tokenizer'

describe('Tokenizer', () => {
  it('tokenizes empty input', () => {
    const tok = new Tokenizer('')
    const tokens = tok.tokenize()
    expect(tokens.length).toBe(1)
    expect(tokens[0].type).toBe('EOF')
  })

  it('tokenizes heading marks', () => {
    const tok = new Tokenizer('= Heading ==')
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('HeadingMark')
    expect(tokens[0].value).toBe('=')
    expect(tokens[1].type).toBe('Text')
    expect(tokens[1].value).toBe(' Heading ')
    expect(tokens[2].type).toBe('HeadingMark')
    expect(tokens[2].value).toBe('==')
  })

  it('tokenizes bold markup', () => {
    const tok = new Tokenizer("'''bold''' text")
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('BoldOpen')
    expect(tokens[0].value).toBe("'''")
    expect(tokens[1].type).toBe('Text')
    expect(tokens[1].value).toBe('bold')
    expect(tokens[2].type).toBe('BoldClose')
    expect(tokens[2].value).toBe("'''")
    expect(tokens[3].type).toBe('Text')
    expect(tokens[3].value).toBe(' text')
  })

  it('tokenizes italic markup', () => {
    const tok = new Tokenizer("''italic'' text")
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('ItalicOpen')
    expect(tokens[0].value).toBe("''")
    expect(tokens[1].type).toBe('Text')
    expect(tokens[1].value).toBe('italic')
    expect(tokens[2].type).toBe('ItalicClose')
    expect(tokens[2].value).toBe("''")
    expect(tokens[3].type).toBe('Text')
    expect(tokens[3].value).toBe(' text')
  })

  it('tokenizes unordered list marker', () => {
    const tok = new Tokenizer('* item')
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('ListMarker')
    expect(tokens[0].value).toBe('*')
  })

  it('tokenizes ordered list marker', () => {
    const tok = new Tokenizer('1. item')
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('ListMarker')
    expect(tokens[0].value).toBe('1.')
  })

  it('tokenizes opening tag', () => {
    const tok = new Tokenizer('<lythuyet>content</lythuyet>')
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('TagOpen')
    expect(tokens[0].value).toBe('<lythuyet>')
    expect(tokens[1].type).toBe('Text')
    expect(tokens[1].value).toBe('content')
    expect(tokens[2].type).toBe('TagClose')
    expect(tokens[2].value).toBe('</lythuyet>')
  })

  it('tokenizes question block with attributes', () => {
    const tok = new Tokenizer('<cauhoi id="C1" loai="trac-nghiem">')
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('TagOpen')
    expect(tokens[0].value).toBe('<cauhoi id="C1" loai="trac-nghiem">')
  })

  it('tracks line and column positions', () => {
    const tok = new Tokenizer('= Title\ncontent')
    const tokens = tok.tokenize()
    expect(tokens[0].line).toBe(1)
    expect(tokens[0].column).toBe(1)
    // After newline, line should increment
    const newlineToken = tokens.find(t => t.type === 'Newline')
    expect(newlineToken).toBeDefined()
    expect(newlineToken!.line).toBe(1)
    // Content after newline is on line 2
    const contentToken = tokens.find(t => t.type === 'Text' && t.value === 'content')
    expect(contentToken).toBeDefined()
    expect(contentToken!.line).toBe(2)
  })

  it('handles Vietnamese text', () => {
    const tok = new Tokenizer('Chào mừng bạn đến với lớp học')
    const tokens = tok.tokenize()
    const textToken = tokens.find(t => t.type === 'Text')
    expect(textToken!.value).toBe('Chào mừng bạn đến với lớp học')
  })

  it('handles bold before italic (3 quotes before 2)', () => {
    const tok = new Tokenizer("'''bold'' text")
    const tokens = tok.tokenize()
    expect(tokens[0].type).toBe('BoldOpen')
    expect(tokens[0].value).toBe("'''")
  })
})