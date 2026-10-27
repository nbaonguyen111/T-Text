export type TokenType =
  | 'HeadingMark'
  | 'BoldOpen'
  | 'BoldClose'
  | 'ItalicOpen'
  | 'ItalicClose'
  | 'ListMarker'
  | 'TagOpen'
  | 'TagClose'
  | 'Text'
  | 'Newline'
  | 'EOF'

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

export class Tokenizer {
  private input: string
  private pos: number
  private line: number
  private column: number
  private tokens: Token[] = []
  private atLineStart: boolean = true
  private inBold: boolean = false
  private inItalic: boolean = false

  constructor(input: string) {
    this.input = input
    this.pos = 0
    this.line = 1
    this.column = 1
  }

  tokenize(): Token[] {
    this.tokens = []
    this.pos = 0
    this.line = 1
    this.column = 1
    this.atLineStart = true

    while (this.pos < this.input.length) {
      this.scanToken()
    }

    this.tokens.push({ type: 'EOF', value: '', line: this.line, column: this.column })
    return this.tokens
  }

  private scanToken(): void {
    const ch = this.input[this.pos]

    if (ch === '\n') {
      this.tokens.push({ type: 'Newline', value: '\n', line: this.line, column: this.column })
      this.pos++
      this.line++
      this.column = 1
      this.atLineStart = true
      return
    }

    if (ch === '\r') {
      this.pos++
      this.column++
      return
    }

    // Handle tags regardless of line position
    if (ch === '<') {
      this.scanTag()
      return
    }

    if (this.atLineStart) {
      if (ch === '=') {
        this.scanHeadingMark()
        return
      }
      if (ch === '*' || ch === '#') {
        this.scanListMarker()
        return
      }
      if (ch >= '0' && ch <= '9') {
        const savedPos = this.pos
        const savedCol = this.column
        let num = ''
        while (this.pos < this.input.length && this.input[this.pos] >= '0' && this.input[this.pos] <= '9') {
          num += this.input[this.pos]
          this.pos++
          this.column++
        }
        if (this.pos < this.input.length && this.input[this.pos] === '.') {
          this.pos++
          this.column++
          this.tokens.push({ type: 'ListMarker', value: num + '.', line: this.line, column: savedCol })
          this.atLineStart = false
          return
        }
        this.pos = savedPos
        this.column = savedCol
      }
    }

    // Handle inline formatting open/close
    if (!this.inBold && this.input.startsWith("'''", this.pos)) {
      this.inBold = true
      this.tokens.push({ type: 'BoldOpen', value: "'''", line: this.line, column: this.column })
      this.pos += 3
      this.column += 3
      this.atLineStart = false
      return
    }

    if (this.inBold && this.input.startsWith("'''", this.pos)) {
      this.inBold = false
      this.tokens.push({ type: 'BoldClose', value: "'''", line: this.line, column: this.column })
      this.pos += 3
      this.column += 3
      this.atLineStart = false
      return
    }

    if (!this.inItalic && this.input.startsWith("''", this.pos)) {
      this.inItalic = true
      this.tokens.push({ type: 'ItalicOpen', value: "''", line: this.line, column: this.column })
      this.pos += 2
      this.column += 2
      this.atLineStart = false
      return
    }

    if (this.inItalic && this.input.startsWith("''", this.pos)) {
      this.inItalic = false
      this.tokens.push({ type: 'ItalicClose', value: "''", line: this.line, column: this.column })
      this.pos += 2
      this.column += 2
      this.atLineStart = false
      return
    }

    this.scanText()
  }

  private scanHeadingMark(): void {
    let marks = ''
    const startCol = this.column
    while (this.pos < this.input.length && this.input[this.pos] === '=') {
      marks += this.input[this.pos]
      this.pos++
      this.column++
    }
    this.tokens.push({ type: 'HeadingMark', value: marks, line: this.line, column: startCol })
    this.atLineStart = false
  }

  private scanListMarker(): void {
    const marker = this.input[this.pos]
    const startCol = this.column
    this.tokens.push({ type: 'ListMarker', value: marker, line: this.line, column: startCol })
    this.pos++
    this.column++
    this.atLineStart = false
  }

  private scanTag(): void {
    const startCol = this.column
    const startLine = this.line
    let tagContent = '<'
    this.pos++
    this.column++

    while (this.pos < this.input.length && this.input[this.pos] !== '>') {
      tagContent += this.input[this.pos]
      if (this.input[this.pos] === '\n') {
        this.line++
        this.column = 1
      } else {
        this.column++
      }
      this.pos++
    }

    if (this.pos < this.input.length && this.input[this.pos] === '>') {
      tagContent += '>'
      this.pos++
      this.column++
    }

    const inner = tagContent.slice(1, -1).trim()
    if (inner.startsWith('/')) {
      this.tokens.push({ type: 'TagClose', value: tagContent, line: startLine, column: startCol })
    } else {
      this.tokens.push({ type: 'TagOpen', value: tagContent, line: startLine, column: startCol })
    }
    this.atLineStart = false
  }

  private scanText(): void {
    let text = ''
    const startCol = this.column
    const startLine = this.line

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos]

      if (ch === '\n') break
      if (this.input.startsWith("'''", this.pos)) break
      if (this.input.startsWith("''", this.pos)) break

      // Stop at tag start regardless of line position
      if (ch === '<') break

      if (this.atLineStart) {
        if (ch === '=' || ch === '*' || ch === '#') break
        if (ch >= '0' && ch <= '9') {
          let temp = this.pos
          while (temp < this.input.length && this.input[temp] >= '0' && this.input[temp] <= '9') {
            temp++
          }
          if (temp < this.input.length && this.input[temp] === '.') break
        }
      }

      text += ch
      this.pos++
      this.column++
    }

    // Check for trailing heading marks (= at end of text before newline)
    let trailingMarks = ''
    let textEnd = text
    while (textEnd.endsWith('=')) {
      trailingMarks = '=' + trailingMarks
      textEnd = textEnd.slice(0, -1)
    }
    // Only treat as heading marks if there's at least one = and the remaining text doesn't end with space
    // This is a heuristic: trailing = marks are likely heading closers
    if (trailingMarks.length > 0 && trailingMarks.length <= 6) {
      // Push the text without trailing marks
      if (textEnd.length > 0) {
        this.tokens.push({ type: 'Text', value: textEnd, line: startLine, column: startCol })
      }
      // Push the trailing marks as HeadingMark
      this.tokens.push({ type: 'HeadingMark', value: trailingMarks, line: startLine, column: startCol + textEnd.length })
    } else {
      this.tokens.push({ type: 'Text', value: text, line: startLine, column: startCol })
    }
    this.atLineStart = false
  }
}