export interface DocumentData {
  id: string
  title: string
  content: string  // Raw TeacherText source
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'ttext_documents'

function getDocuments(): DocumentData[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveDocuments(docs: DocumentData[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export function listDocuments(): DocumentData[] {
  return getDocuments().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function createDocument(title: string, content: string): DocumentData {
  const docs = getDocuments()
  const now = new Date().toISOString()
  const doc: DocumentData = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  }
  docs.push(doc)
  saveDocuments(docs)
  return doc
}

export function getDocument(id: string): DocumentData | undefined {
  return getDocuments().find(d => d.id === id)
}

export function updateDocument(id: string, updates: Partial<DocumentData>): DocumentData | null {
  const docs = getDocuments()
  const idx = docs.findIndex(d => d.id === id)
  if (idx === -1) return null
  docs[idx] = { ...docs[idx], ...updates, updatedAt: new Date().toISOString() }
  saveDocuments(docs)
  return docs[idx]
}

export function deleteDocument(id: string): boolean {
  const docs = getDocuments()
  const filtered = docs.filter(d => d.id !== id)
  if (filtered.length === docs.length) return false
  saveDocuments(filtered)
  return true
}