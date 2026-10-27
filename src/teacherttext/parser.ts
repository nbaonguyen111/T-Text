import { Token, TokenType } from './tokenizer'
import {
  Document, Block, Inline,
  Heading, Paragraph, List, ListItem,
  TheoryBlock, ExampleBlock, QuestionBlock,
  AnswerBlock, SolutionBlock,
  SourceLocation, Level,
} from './ast'
import { Diagnostic, createDiagnostic } from './diagnostics'

export interface ParserState {
  tokens: Token[]
  pos: number
  diagnostics: Diagnostic[]
}

function currentToken(state: ParserState): Token {
  return state.tokens[state.pos]
}

function isAtEnd(state: ParserState): boolean {
  return currentToken(state).type === 'EOF'
}

function consume(state: ParserState): Token {
  const token = currentToken(state)
  if (!isAtEnd(state)) {
    state.pos++
  }
  return token
}

function expect(state: ParserState, type: TokenType): Token | null {
  const token = currentToken(state)
  if (token.type === type) {
    return consume(state)
  }
  state.diagnostics.push(createDiagnostic(
    'error',
    'UNEXPECTED_TOKEN',
    `Tính token ${type} nhưng nhận ${token.type} (${JSON.stringify(token.value)})`,
    token.line, token.column,
  ))
  return null
}

function makeLoc(start: Token, end: Token): SourceLocation {
  return {
    start: { line: start.line, column: start.column },
    end: { line: end.line, column: end.column + end.value.length },
  }
}

function tokenLoc(token: Token): SourceLocation {
  return {
    start: { line: token.line, column: token.column },
    end: { line: token.line, column: token.column + token.value.length },
  }
}

function parseInlineContent(state: ParserState): Inline[] {
  const inlines: Inline[] = []

  while (!isAtEnd(state)) {
    const token = currentToken(state)

    if (token.type === 'Newline' || token.type === 'EOF') break
    if (token.type === 'TagClose') break
    if (token.type === 'BoldClose' || token.type === 'ItalicClose') break

    if (token.type === 'BoldOpen') {
      consume(state)
      const children = parseInlineContent(state)
      expect(state, 'BoldClose')
      inlines.push({ type: 'Bold', children, loc: makeLoc(token, currentToken(state)) })
      continue
    }

    if (token.type === 'ItalicOpen') {
      consume(state)
      const children = parseInlineContent(state)
      expect(state, 'ItalicClose')
      inlines.push({ type: 'Italic', children, loc: makeLoc(token, currentToken(state)) })
      continue
    }

    if (token.type === 'Text') {
      consume(state)
      const linkMatch = parseLink(token.value)
      if (linkMatch) {
        inlines.push({
          type: 'Link',
          href: linkMatch.href,
          children: [{ type: 'Text', value: linkMatch.label, loc: tokenLoc(token) }],
          loc: makeLoc(token, token),
        })
      } else {
        inlines.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
      }
      continue
    }

    consume(state)
  }

  return inlines
}

function parseLink(text: string): { href: string; label: string } | null {
  const linkRegex = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/
  const match = text.match(linkRegex)
  if (!match) return null
  return {
    href: match[1].trim(),
    label: (match[2] || match[1]).trim(),
  }
}

function parseAttributes(tagValue: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const inner = tagValue.slice(1, -1).trim()
  const parts = inner.split(/\s+/)
  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i].indexOf('=')
    if (eqIndex > 0) {
      const key = parts[i].slice(0, eqIndex)
      let val = parts[i].slice(eqIndex + 1)
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      }
      attrs[key] = val
    }
  }
  return attrs
}

export function parse(tokens: Token[]): { ast: Document; diagnostics: Diagnostic[] } {
  const state: ParserState = { tokens, pos: 0, diagnostics: [] }

  const children: Block[] = []

  while (!isAtEnd(state)) {
    const token = currentToken(state)

    if (token.type === 'Newline') {
      consume(state)
      continue
    }

    if (token.type === 'HeadingMark') {
      const heading = parseHeading(state)
      if (heading) children.push(heading)
      continue
    }

    if (token.type === 'ListMarker') {
      const list = parseList(state)
      if (list) children.push(list)
      continue
    }

    if (token.type === 'TagOpen') {
      const block = parseTeacherBlock(state)
      if (block) children.push(block)
      continue
    }

    if (token.type === 'Text' || token.type === 'BoldOpen' || token.type === 'ItalicOpen') {
      const paragraph = parseParagraph(state)
      if (paragraph) children.push(paragraph)
      continue
    }

    consume(state)
  }

  const ast: Document = {
    type: 'Document',
    children,
    loc: {
      start: { line: 1, column: 1 },
      end: {
        line: state.tokens[state.tokens.length - 1].line,
        column: state.tokens[state.tokens.length - 1].column,
      },
    },
  }

  return { ast, diagnostics: state.diagnostics }
}

function parseHeading(state: ParserState): Heading | null {
  const markToken = consume(state)
  if (!markToken) return null
  const level = markToken.value.length as Level

  while (!isAtEnd(state) && currentToken(state).type === 'Newline') {
    consume(state)
  }

  const children: Inline[] = []
  while (!isAtEnd(state) && currentToken(state).type !== 'Newline' && currentToken(state).type !== 'EOF') {
    const token = currentToken(state)
    if (token.type === 'Text') {
      consume(state)
      const linkMatch = parseLink(token.value)
      if (linkMatch) {
        children.push({
          type: 'Link',
          href: linkMatch.href,
          children: [{ type: 'Text', value: linkMatch.label, loc: tokenLoc(token) }],
          loc: tokenLoc(token),
        })
      } else {
        children.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
      }
    } else if (token.type === 'BoldOpen') {
      consume(state)
      const boldChildren = parseInlineContent(state)
      expect(state, 'BoldClose')
      children.push({ type: 'Bold', children: boldChildren, loc: makeLoc(token, currentToken(state)) })
    } else if (token.type === 'ItalicOpen') {
      consume(state)
      const italicChildren = parseInlineContent(state)
      expect(state, 'ItalicClose')
      children.push({ type: 'Italic', children: italicChildren, loc: makeLoc(token, currentToken(state)) })
    } else {
      consume(state)
    }
  }

  return {
    type: 'Heading',
    level,
    children,
    loc: makeLoc(markToken, currentToken(state)),
  }
}

function parseParagraph(state: ParserState): Paragraph | null {
  const children: Inline[] = []

  while (!isAtEnd(state) && currentToken(state).type !== 'Newline' && currentToken(state).type !== 'EOF') {
    const token = currentToken(state)

    if (token.type === 'ListMarker' || token.type === 'HeadingMark' || token.type === 'TagOpen') {
      break
    }

    if (token.type === 'Text') {
      consume(state)
      const linkMatch = parseLink(token.value)
      if (linkMatch) {
        children.push({
          type: 'Link',
          href: linkMatch.href,
          children: [{ type: 'Text', value: linkMatch.label, loc: tokenLoc(token) }],
          loc: tokenLoc(token),
        })
      } else {
        children.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
      }
    } else if (token.type === 'BoldOpen') {
      consume(state)
      const boldChildren = parseInlineContent(state)
      expect(state, 'BoldClose')
      children.push({ type: 'Bold', children: boldChildren, loc: makeLoc(token, currentToken(state)) })
    } else if (token.type === 'ItalicOpen') {
      consume(state)
      const italicChildren = parseInlineContent(state)
      expect(state, 'ItalicClose')
      children.push({ type: 'Italic', children: italicChildren, loc: makeLoc(token, currentToken(state)) })
    } else {
      consume(state)
    }
  }

  return {
    type: 'Paragraph',
    children,
    loc: {
      start: { line: 1, column: 1 },
      end: { line: 1, column: 1 },
    },
  }
}

function parseList(state: ParserState): List | null {
  const firstMarker = currentToken(state)
  if (firstMarker.type !== 'ListMarker') return null

  const ordered = firstMarker.value === '#' || /^\d+\.$/.test(firstMarker.value)
  const items: ListItem[] = []

  while (!isAtEnd(state) && currentToken(state).type === 'ListMarker') {
    const marker = consume(state)
    const itemChildren: Inline[] = []

    while (!isAtEnd(state) && currentToken(state).type !== 'Newline' && currentToken(state).type !== 'EOF' && currentToken(state).type !== 'ListMarker') {
      const token = currentToken(state)
      if (token.type === 'Text') {
        consume(state)
        itemChildren.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
      } else if (token.type === 'BoldOpen') {
        consume(state)
        const children = parseInlineContent(state)
        expect(state, 'BoldClose')
        itemChildren.push({ type: 'Bold', children, loc: makeLoc(token, currentToken(state)) })
      } else if (token.type === 'ItalicOpen') {
        consume(state)
        const children = parseInlineContent(state)
        expect(state, 'ItalicClose')
        itemChildren.push({ type: 'Italic', children, loc: makeLoc(token, currentToken(state)) })
      } else {
        consume(state)
      }
    }

    items.push({
      type: 'ListItem',
      children: itemChildren,
      loc: makeLoc(marker, currentToken(state)),
    })

    if (!isAtEnd(state) && currentToken(state).type === 'Newline') {
      consume(state)
    }
  }

  return {
    type: 'List',
    ordered,
    items,
    loc: makeLoc(firstMarker, currentToken(state)),
  }
}

function parseTeacherBlock(state: ParserState): Block | null {
  const openToken = currentToken(state)
  if (openToken.type !== 'TagOpen') return null

  const tagContent = openToken.value.slice(1, -1).trim()
  const tagName = tagContent.split(/\s+/)[0]

  consume(state)

  if (tagName === 'lythuyet') {
    return parseSimpleBlock(state, 'TheoryBlock', openToken)
  }

  if (tagName === 'vidu') {
    return parseSimpleBlock(state, 'ExampleBlock', openToken)
  }

  if (tagName === 'cauhoi') {
    return parseQuestionBlock(state, openToken)
  }

  skipUntilClose(state, tagName)
  return null
}

function parseSimpleBlock(state: ParserState, type: 'TheoryBlock' | 'ExampleBlock', openToken: Token): TheoryBlock | ExampleBlock | null {
  const children: Inline[] = []

  while (!isAtEnd(state)) {
    const token = currentToken(state)
    if (token.type === 'TagClose') {
      consume(state)
      break
    }
    if (token.type === 'Text') {
      consume(state)
      children.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
    } else if (token.type === 'BoldOpen') {
      consume(state)
      const boldChildren = parseInlineContent(state)
      expect(state, 'BoldClose')
      children.push({ type: 'Bold', children: boldChildren, loc: makeLoc(token, currentToken(state)) })
    } else if (token.type === 'ItalicOpen') {
      consume(state)
      const italicChildren = parseInlineContent(state)
      expect(state, 'ItalicClose')
      children.push({ type: 'Italic', children: italicChildren, loc: makeLoc(token, currentToken(state)) })
    } else if (token.type === 'Newline') {
      consume(state)
      children.push({ type: 'LineBreak', loc: tokenLoc(token) })
    } else {
      consume(state)
    }
  }

  return {
    type,
    children,
    loc: makeLoc(openToken, currentToken(state)),
  } as TheoryBlock | ExampleBlock
}

function parseQuestionBlock(state: ParserState, openToken: Token): QuestionBlock | null {
  const attrs = parseAttributes(openToken.value)
  const id = attrs['id'] || ''
  const loai = attrs['loai'] || ''

  if (!id) {
    state.diagnostics.push(createDiagnostic(
      'error', 'MISSING_QUESTION_ID',
      'Thẻ <cauhoi> phải có thuộc tính id',
      openToken.line, openToken.column,
    ))
  }

  const children: Inline[] = []
  let answer: AnswerBlock | undefined
  let solution: SolutionBlock | undefined

  while (!isAtEnd(state)) {
    const token = currentToken(state)

    if (token.type === 'TagClose') {
      consume(state)
      break
    }

    if (token.type === 'TagOpen') {
      const innerTag = token.value.slice(1, -1).trim()
      const innerTagName = innerTag.split(/\s+/)[0]

      if (innerTagName === 'dapan') {
        consume(state)
        const ansChildren: Inline[] = []
        while (!isAtEnd(state)) {
          const t = currentToken(state)
          if (t.type === 'TagClose') { consume(state); break }
          if (t.type === 'Text') { consume(state); ansChildren.push({ type: 'Text', value: t.value, loc: tokenLoc(t) }) }
          else { consume(state) }
        }
        answer = { type: 'AnswerBlock', children: ansChildren, loc: makeLoc(token, currentToken(state)) }
        continue
      }

      if (innerTagName === 'loigiai') {
        consume(state)
        const solChildren: Inline[] = []
        while (!isAtEnd(state)) {
          const t = currentToken(state)
          if (t.type === 'TagClose') { consume(state); break }
          if (t.type === 'Text') { consume(state); solChildren.push({ type: 'Text', value: t.value, loc: tokenLoc(t) }) }
          else { consume(state) }
        }
        solution = { type: 'SolutionBlock', children: solChildren, loc: makeLoc(token, currentToken(state)) }
        continue
      }
    }

    if (token.type === 'Text') {
      consume(state)
      children.push({ type: 'Text', value: token.value, loc: tokenLoc(token) })
    } else if (token.type === 'Newline') {
      consume(state)
      children.push({ type: 'LineBreak', loc: tokenLoc(token) })
    } else {
      consume(state)
    }
  }

  return {
    type: 'QuestionBlock',
    id,
    loai,
    children,
    answer,
    solution,
    loc: makeLoc(openToken, currentToken(state)),
  }
}

function skipUntilClose(state: ParserState, tagName: string): void {
  while (!isAtEnd(state)) {
    const token = currentToken(state)
    if (token.type === 'TagClose') {
      const inner = token.value.slice(2, -1).trim()
      if (inner === tagName || inner.startsWith(tagName + ' ')) {
        consume(state)
        return
      }
    }
    consume(state)
  }
}