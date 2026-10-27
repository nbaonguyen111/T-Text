import {
  AstNode, Document,
  Heading, Paragraph, List, ListItem,
  TheoryBlock, ExampleBlock, QuestionBlock,
  AnswerBlock, SolutionBlock,
  Text, Bold, Italic, Link, MathInline, MathBlock,
} from './ast'

export interface RenderOptions {
  studentMode: boolean
}

export function render(ast: Document, options: RenderOptions = { studentMode: false }): string {
  const html = renderChildren(ast.children, options)
  return `<div class="teacherttext-output">${html}</div>`
}

function renderChildren(nodes: AstNode[], options: RenderOptions): string {
  return nodes.map(node => renderNode(node, options)).join('')
}

function renderNode(node: AstNode, options: RenderOptions): string {
  switch (node.type) {
    case 'Document':
      return renderChildren((node as Document).children, options)
    case 'Heading':
      return renderHeading(node as Heading, options)
    case 'Paragraph':
      return renderParagraph(node as Paragraph, options)
    case 'List':
      return renderList(node as List, options)
    case 'ListItem':
      return renderListItem(node as ListItem, options)
    case 'TheoryBlock':
      return renderTheoryBlock(node as TheoryBlock, options)
    case 'ExampleBlock':
      return renderExampleBlock(node as ExampleBlock, options)
    case 'QuestionBlock':
      return renderQuestionBlock(node as QuestionBlock, options)
    case 'AnswerBlock':
      return renderAnswerBlock(node as AnswerBlock, options)
    case 'SolutionBlock':
      return renderSolutionBlock(node as SolutionBlock, options)
    case 'Text':
      return escapeHtml((node as Text).value)
    case 'Bold':
      return `<strong>${renderChildren((node as Bold).children, options)}</strong>`
    case 'Italic':
      return `<em>${renderChildren((node as Italic).children, options)}</em>`
    case 'Link':
      return `<a href="${escapeHtml((node as Link).href)}" class="tt-link">${renderChildren((node as Link).children, options)}</a>`
    case 'MathInline':
      return `<span class="tt-math-inline">\\(${escapeHtml((node as MathInline).value)}\\)</span>`
    case 'MathBlock':
      return `<div class="tt-math-block">\\[${escapeHtml((node as MathBlock).value)}\\]</div>`
    case 'LineBreak':
      return '<br>'
    default:
      return ''
  }
}

function renderHeading(node: Heading, options: RenderOptions): string {
  const level = node.level
  const content = renderChildren(node.children, options)
  return `<h${level} class="tt-heading tt-h${level}">${content}</h${level}>`
}

function renderParagraph(node: Paragraph, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<p class="tt-paragraph">${content}</p>`
}

function renderList(node: List, options: RenderOptions): string {
  const tag = node.ordered ? 'ol' : 'ul'
  const itemsHtml = node.items.map(item => renderListItem(item, options)).join('')
  return `<${tag} class="tt-list tt-${node.ordered ? 'ordered' : 'unordered'}">${itemsHtml}</${tag}>`
}

function renderListItem(node: ListItem, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<li class="tt-list-item">${content}</li>`
}

function renderTheoryBlock(node: TheoryBlock, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<div class="tt-block tt-theory"><div class="tt-block-title">Lý thuyết</div><div class="tt-block-content">${content}</div></div>`
}

function renderExampleBlock(node: ExampleBlock, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<div class="tt-block tt-example"><div class="tt-block-title">Ví dụ</div><div class="tt-block-content">${content}</div></div>`
}

function renderQuestionBlock(node: QuestionBlock, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  let answerHtml = ''
  let solutionHtml = ''

  if (node.answer && !options.studentMode) {
    answerHtml = `<div class="tt-answer"><strong>Đáp án:</strong> ${renderChildren(node.answer.children, options)}</div>`
  }
  if (node.solution && !options.studentMode) {
    solutionHtml = `<div class="tt-solution"><strong>Lời giải:</strong> ${renderChildren(node.solution.children, options)}</div>`
  }

  return `
    <div class="tt-block tt-question" id="q-${escapeHtml(node.id)}" data-loai="${escapeHtml(node.loai)}">
      <div class="tt-block-title">Câu hỏi ${escapeHtml(node.id)}</div>
      <div class="tt-block-content">${content}</div>
      ${answerHtml}
      ${solutionHtml}
    </div>
  `
}

function renderAnswerBlock(node: AnswerBlock, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<div class="tt-answer"><strong>Đáp án:</strong> ${content}</div>`
}

function renderSolutionBlock(node: SolutionBlock, options: RenderOptions): string {
  const content = renderChildren(node.children, options)
  return `<div class="tt-solution"><strong>Lời giải:</strong> ${content}</div>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}