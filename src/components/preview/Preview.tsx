'use client'

import { useEffect, useRef, useState } from 'react'
import { Tokenizer, parse, validate, render, type Diagnostic } from '@/teacherttext'

export interface PreviewProps {
  source: string
  studentMode: boolean
}

export function Preview({ source, studentMode }: PreviewProps) {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [html, setHtml] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Run tokenizer + parser
    const tokenizer = new Tokenizer(source)
    const tokens = tokenizer.tokenize()
    const { ast, diagnostics: parseDiagnostics } = parse(tokens)

    // Validate
    const validationDiagnostics = validate(ast)
    const allDiagnostics = [...parseDiagnostics, ...validationDiagnostics]
    setDiagnostics(allDiagnostics)

    // Render
    const rendered = render(ast, { studentMode })
    setHtml(rendered)
  }, [source, studentMode])

  return (
    <div className="border rounded p-4 bg-white h-full overflow-y-auto">
      {diagnostics.length > 0 && (
        <div className="mb-3 p-3 rounded bg-amber-50 border border-amber-200">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Lỗi cú pháp</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {diagnostics.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-xs">{d.line}:{d.column}</span>
                <span>{d.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div
        ref={containerRef}
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}