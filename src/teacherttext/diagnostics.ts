export interface Diagnostic {
  type: 'error' | 'warning'
  code: string
  message: string
  line: number
  column: number
  endLine?: number
  endColumn?: number
}

export function createDiagnostic(
  type: Diagnostic['type'],
  code: string,
  message: string,
  line: number,
  column: number,
  endLine?: number,
  endColumn?: number,
): Diagnostic {
  return { type, code, message, line, column, endLine, endColumn }
}