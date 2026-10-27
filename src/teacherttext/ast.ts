export type Level = 1 | 2 | 3 | 4 | 5 | 6

export interface Position {
  line: number
  column: number
}

export interface SourceLocation {
  start: Position
  end: Position
}

export type AstNodeType =
  | 'Document'
  | 'Heading'
  | 'Paragraph'
  | 'List'
  | 'ListItem'
  | 'TheoryBlock'
  | 'ExampleBlock'
  | 'QuestionBlock'
  | 'AnswerBlock'
  | 'SolutionBlock'
  | 'HorizontalRule'
  | 'Text'
  | 'Bold'
  | 'Italic'
  | 'Link'
  | 'MathInline'
  | 'MathBlock'
  | 'LineBreak'

// Base node interface
export interface AstNode {
  type: AstNodeType
  loc: SourceLocation
}

// Document is the root node
export interface Document extends AstNode {
  type: 'Document'
  children: Block[]
}

// Block-level nodes
export type Block =
  | Heading
  | Paragraph
  | List
  | TheoryBlock
  | ExampleBlock
  | QuestionBlock
  | HorizontalRule

export interface Heading extends AstNode {
  type: 'Heading'
  level: Level
  children: Inline[]
}

export interface Paragraph extends AstNode {
  type: 'Paragraph'
  children: Inline[]
}

export interface List extends AstNode {
  type: 'List'
  ordered: boolean
  items: ListItem[]
}

export interface ListItem extends AstNode {
  type: 'ListItem'
  children: Inline[]
}

// Teacher-specific blocks
export interface TheoryBlock extends AstNode {
  type: 'TheoryBlock'
  children: Inline[]
}

export interface ExampleBlock extends AstNode {
  type: 'ExampleBlock'
  children: Inline[]
}

export interface QuestionBlock extends AstNode {
  type: 'QuestionBlock'
  id: string
  loai: string
  children: Inline[]
  answer?: AnswerBlock
  solution?: SolutionBlock
}

export interface AnswerBlock extends AstNode {
  type: 'AnswerBlock'
  children: Inline[]
}

export interface SolutionBlock extends AstNode {
  type: 'SolutionBlock'
  children: Inline[]
}

// Horizontal rule
export interface HorizontalRule extends AstNode {
  type: 'HorizontalRule'
}

// Inline nodes
export type Inline =
  | Text
  | Bold
  | Italic
  | Link
  | MathInline
  | MathBlock
  | LineBreak

export interface Text extends AstNode {
  type: 'Text'
  value: string
}

export interface Bold extends AstNode {
  type: 'Bold'
  children: Inline[]
}

export interface Italic extends AstNode {
  type: 'Italic'
  children: Inline[]
}

export interface Link extends AstNode {
  type: 'Link'
  href: string
  children: Inline[]
}

export interface MathInline extends AstNode {
  type: 'MathInline'
  value: string
}

export interface MathBlock extends AstNode {
  type: 'MathBlock'
  value: string
}

export interface LineBreak extends AstNode {
  type: 'LineBreak'
}

// Type guards
export function isBlock(node: AstNode): node is Block {
  return (
    node.type === 'Heading' ||
    node.type === 'Paragraph' ||
    node.type === 'List' ||
    node.type === 'TheoryBlock' ||
    node.type === 'ExampleBlock' ||
    node.type === 'QuestionBlock' ||
    node.type === 'HorizontalRule'
  )
}

export function isInline(node: AstNode): node is Inline {
  return (
    node.type === 'Text' ||
    node.type === 'Bold' ||
    node.type === 'Italic' ||
    node.type === 'Link' ||
    node.type === 'MathInline' ||
    node.type === 'MathBlock' ||
    node.type === 'LineBreak'
  )
}