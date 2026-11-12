import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { addComment, getCommentsByDocument } from '../../api/comments'
import {
  createPresignedUpload,
  getDocumentById,
  updateDocument,
  uploadToPresignedUrl,
} from '../../api/documents'
import { getUsers } from '../../api/users'
import { createVersion, getVersionsByDocument } from '../../api/versions'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Modal } from '../../components/Modal'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatDate'
import { extractListData } from '../../utils/listResponse'

export function DocumentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { state, addNotification } = useApp()

  const [document, setDocument] = useState(null)
  const [versions, setVersions] = useState([])
  const [comments, setComments] = useState([])
  const [usersById, setUsersById] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)
  const [newVersionFile, setNewVersionFile] = useState(null)
  const [changelog, setChangelog] = useState('')

  const category = useMemo(
    () => state.categories.find((item) => Number(item.id) === Number(document?.categoryId)),
    [document?.categoryId, state.categories],
  )

  const department = useMemo(
    () =>
      state.departments.find(
        (item) => Number(item.id) === Number(document?.departmentId),
      ),
    [document?.departmentId, state.departments],
  )

  const loadData = useCallback(async () => {
    if (!id) {
      return
    }

    setIsLoading(true)

    try {
      const [docData, versionData, commentData, usersResponse] = await Promise.all([
        getDocumentById(id),
        getVersionsByDocument(id),
        getCommentsByDocument(id),
        getUsers(),
      ])
      const users = extractListData(usersResponse.data)

      const mappedUsers = Object.fromEntries(
        users.map((currentUser) => [String(currentUser.id), currentUser]),
      )

      setDocument(docData)
      setVersions(versionData)
      setComments(commentData)
      setUsersById(mappedUsers)
    } catch {
      addNotification('Failed to load document details.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification, id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleAddComment(event) {
    event.preventDefault()

    if (!user || !newComment.trim()) {
      return
    }

    try {
      await addComment({
        documentId: Number(id),
        userId: user.id,
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      })

      setNewComment('')
      addNotification('Comment added successfully.')
      await loadData()
    } catch {
      addNotification('Failed to add comment.', 'error')
    }
  }

  async function handleCreateVersion(event) {
    event.preventDefault()

    if (!user) {
      return
    }

    if (!newVersionFile) {
      addNotification('Select a file to upload.', 'error')
      return
    }

    try {
      const nextVersionNumber = versions.length
        ? Math.max(...versions.map((version) => Number(version.versionNumber))) + 1
        : 1

      const now = new Date().toISOString()

      const presign = await createPresignedUpload({
        fileName: newVersionFile.name,
        contentType: newVersionFile.type || 'application/octet-stream',
      })

      await uploadToPresignedUrl(
        presign.url,
        newVersionFile,
        newVersionFile.type,
      )

      const createdVersion = await createVersion({
        documentId: Number(id),
        versionNumber: nextVersionNumber,
        fileName: newVersionFile.name,
        fileKey: presign.key,
        contentType: newVersionFile.type || 'application/octet-stream',
        fileSize: newVersionFile.size || 0,
        uploadedBy: user.id,
        createdAt: now,
        changelog: changelog || `Version ${nextVersionNumber}`,
      })

      await updateDocument(id, {
        currentVersionId: createdVersion.id,
        updatedAt: now,
      })

      setChangelog('')
      setNewVersionFile(null)
      setIsVersionModalOpen(false)
      addNotification('Version created successfully.')
      await loadData()
    } catch {
      addNotification('Failed to create new version.', 'error')
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading document detail..." />
  }

  if (!document) {
    return <p className="text-slate-600">Document not found.</p>
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">{document.title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {category?.name || 'Unknown'} • {department?.name || 'Unknown'}
        </p>
        <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
          <p>Owner ID: {document.ownerId}</p>
          <p>Created: {formatDate(document.createdAt)}</p>
          <p>Updated: {formatDate(document.updatedAt)}</p>
          <p>Current version ID: {document.currentVersionId || 'N/A'}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {document.tags?.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Version History</h3>
          <button
            type="button"
            onClick={() => setIsVersionModalOpen(true)}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Create New Version
          </button>
        </div>
        <ul className="space-y-2">
          {versions.map((version) => (
            <li key={version.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-800">Version {version.versionNumber}</p>
              <p className="text-slate-600">Uploaded: {formatDate(version.createdAt)}</p>
              <p className="text-slate-600">Changelog: {version.changelog}</p>
              {version.downloadUrl ? (
                <a
                  href={version.downloadUrl}
                  className="text-blue-700 underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              ) : (
                <span className="text-slate-400">No file</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Comments</h3>

        <form className="mb-4 space-y-2" onSubmit={handleAddComment}>
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Write your comment"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Add Comment
          </button>
        </form>

        <ul className="space-y-2">
          {comments.map((comment) => {
            const commentUser = usersById[String(comment.userId)]

            return (
              <li key={comment.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">
                  {commentUser?.name || `User ${comment.userId}`}
                </p>
                <p className="text-xs text-slate-500">{formatDate(comment.createdAt)}</p>
                <p className="mt-1 text-sm text-slate-700">{comment.text}</p>
              </li>
            )
          })}
        </ul>
      </div>

      {isVersionModalOpen ? (
        <Modal
          title="Create New Version"
          onClose={() => {
            setIsVersionModalOpen(false)
            setNewVersionFile(null)
            setChangelog('')
          }}
        >
          <form className="space-y-3" onSubmit={handleCreateVersion}>
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">File</span>
              <input
                type="file"
                onChange={(event) => setNewVersionFile(event.target.files?.[0] || null)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Changelog</span>
              <textarea
                value={changelog}
                onChange={(event) => setChangelog(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Save Version
            </button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
