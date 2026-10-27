'use client'

import { useEffect, useState, useCallback } from 'react'
import { Preview } from '../preview/Preview'
import { listDocuments, createDocument, updateDocument, deleteDocument, type DocumentData } from '@/lib/storage'

export function Editor() {
  const [documents, setDocuments] = useState<DocumentData[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [studentMode, setStudentMode] = useState<boolean>(false)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)

  useEffect(() => {
    setDocuments(listDocuments())
  }, [])

  useEffect(() => {
    if (currentId) {
      const doc = documents.find(d => d.id === currentId)
      if (doc) {
        setTitle(doc.title)
        setSource(doc.content)
        setIsDirty(false)
      }
    }
  }, [currentId, documents])

  const handleNewDocument = () => {
    setCurrentId(null)
    setTitle('')
    setSource('')
    setIsDirty(false)
    setShowDeleteConfirm(false)
    setConfirmTargetId(null)
  }

  const handleSave = () => {
    if (currentId) {
      updateDocument(currentId, { title, content: source })
      setDocuments(listDocuments())
    } else {
      const doc = createDocument(title || 'Tài liệu mới', source)
      setCurrentId(doc.id)
      setDocuments(listDocuments())
    }
    setIsDirty(false)
  }

  const handleDelete = (id: string) => {
    setConfirmTargetId(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (confirmTargetId) {
      deleteDocument(confirmTargetId)
      if (currentId === confirmTargetId) {
        handleNewDocument()
      }
      setDocuments(listDocuments())
    }
    setShowDeleteConfirm(false)
    setConfirmTargetId(null)
  }

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSource(e.target.value)
    setIsDirty(true)
  }

  const handleStudentModeToggle = () => {
    setStudentMode(!studentMode)
  }

  const autoSave = useCallback(() => {
    if (!isDirty || !currentId) return
    updateDocument(currentId, { title, content: source })
    setIsDirty(false)
  }, [isDirty, currentId, title, source])

  useEffect(() => {
    const timer = setTimeout(autoSave, 2000)
    return () => clearTimeout(timer)
  }, [source, title, isDirty, currentId, autoSave])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">TeacherText</h1>
          <p className="text-sm text-gray-500">Soạn tài liệu giảng dạy</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNewDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!currentId && !source && !title}
          >
            Tài liệu mới
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={!isDirty}
          >
            Lưu
          </button>
          <button
            onClick={handleStudentModeToggle}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {studentMode ? 'Chế độ giáo viên' : 'Chế độ học sinh'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4">
        <div className="w-64 border-r border-gray-200 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Tài liệu</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => setCurrentId(doc.id)}
                className={`p-2 rounded cursor-pointer border ${
                  currentId === doc.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">{doc.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {new Date(doc.updatedAt).toLocaleString('vi-VN')}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(doc.id) }}
                  className="ml-2 text-xs text-red-500 hover:text-red-700"
                >
                  Xóa
                </button>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-4">Chưa có tài liệu</div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex flex-col md:flex-row gap-4 flex-1 min-w-0">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
                <label className="text-sm font-medium text-gray-700">Nguồn TeacherText</label>
                <span className={`text-xs font-mono ${isDirty ? 'text-orange-500' : 'text-gray-400'}`}>
                  {isDirty ? 'Đang soạn thảo...' : 'Đã lưu'}
                </span>
              </div>
              <textarea
                value={source}
                onChange={handleSourceChange}
                className="flex-1 w-full h-full font-mono text-sm p-4 border-b border-gray-200 focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
                <label className="text-sm font-medium text-gray-700">Xem trước</label>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Preview source={source} studentMode={studentMode} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && confirmTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-6">Bạn có chắc muốn xóa tài liệu này?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}