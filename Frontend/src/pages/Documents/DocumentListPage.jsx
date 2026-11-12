import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createDocument,
  createPresignedUpload,
  getDocuments,
  updateDocument,
  uploadToPresignedUrl,
} from '../../api/documents'
import { createVersion } from '../../api/versions'
import { FilterBar } from '../../components/FilterBar'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Modal } from '../../components/Modal'
import { Pagination } from '../../components/Pagination'
import { SearchBar } from '../../components/SearchBar'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../hooks/useAuth'
import { formatDate } from '../../utils/formatDate'
import { extractListData, extractTotalPages } from '../../utils/listResponse'

const PAGE_SIZE = 6

const initialForm = {
  title: '',
  categoryId: '',
  departmentId: '',
  tags: '',
  file: null,
}

export function DocumentListPage() {
  const { state, addNotification } = useApp()
  const { user } = useAuth()

  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    categoryId: '',
    departmentId: '',
  })
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [formState, setFormState] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)

  const filterConfig = useMemo(
    () => [
      {
        key: 'categoryId',
        label: 'Category',
        options: state.categories.map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
      },
      {
        key: 'departmentId',
        label: 'Department',
        options: state.departments.map((department) => ({
          value: String(department.id),
          label: department.name,
        })),
      },
    ],
    [state.categories, state.departments],
  )

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await getDocuments({
        _page: page,
        _per_page: PAGE_SIZE,
        ...(search ? { title_like: search } : {}),
        ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
        ...(filters.departmentId
          ? { departmentId: Number(filters.departmentId) }
          : {}),
      })
      const nextDocuments = extractListData(response.data)

      setDocuments(nextDocuments)
      setTotalPages(extractTotalPages(response, PAGE_SIZE, nextDocuments))
    } catch {
      addNotification('Failed to load documents.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification, filters.categoryId, filters.departmentId, page, search])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleUploadSubmit(event) {
    event.preventDefault()

    if (!user) {
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()
      const tags = formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)

      let fileKey = null
      let fileName = null
      let contentType = null
      let fileSize = 0

      if (formState.file) {
        const presign = await createPresignedUpload({
          fileName: formState.file.name,
          contentType: formState.file.type || 'application/octet-stream',
        })

        await uploadToPresignedUrl(
          presign.url,
          formState.file,
          formState.file.type,
        )

        fileKey = presign.key
        fileName = formState.file.name
        contentType = formState.file.type || 'application/octet-stream'
        fileSize = formState.file.size || 0
      }

      const document = await createDocument({
        title: formState.title,
        categoryId: Number(formState.categoryId),
        departmentId: Number(formState.departmentId),
        ownerId: user.id,
        createdAt: now,
        updatedAt: now,
        currentVersionId: null,
        tags,
        fileKey,
        fileName,
        contentType,
        fileSize,
      })

      let version = null

      if (fileKey) {
        version = await createVersion({
          documentId: document.id,
          versionNumber: 1,
          fileName,
          fileKey,
          contentType,
          fileSize,
          uploadedBy: user.id,
          createdAt: now,
          changelog: 'Initial upload',
        })
      }

      if (version) {
        await updateDocument(document.id, {
          currentVersionId: version.id,
          updatedAt: now,
        })
      }

      addNotification('Document uploaded successfully.')
      setFormState(initialForm)
      setIsUploadOpen(false)
      await loadDocuments()
    } catch {
      addNotification('Failed to upload document.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading documents..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Documents</h2>
          <p className="text-sm text-slate-500">Browse and manage your documents.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Upload Document
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <SearchBar
          value={search}
          onChange={(value) => {
            setPage(1)
            setSearch(value)
          }}
          placeholder="Search by title"
        />
        <FilterBar filters={filterConfig} values={filters} onChange={updateFilter} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((document) => {
          const category = state.categories.find(
            (item) => Number(item.id) === Number(document.categoryId),
          )
          const department = state.departments.find(
            (item) => Number(item.id) === Number(document.departmentId),
          )

          return (
            <article
              key={document.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{document.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {category?.name || 'Unknown'} • {department?.name || 'Unknown'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Updated {formatDate(document.updatedAt)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {document.tags?.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                to={`/documents/${document.id}`}
                className="mt-4 inline-block rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
              >
                View Details
              </Link>
            </article>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {isUploadOpen ? (
        <Modal
          title="Upload Document"
          onClose={() => {
            setIsUploadOpen(false)
            setFormState(initialForm)
          }}
        >
          <form className="space-y-3" onSubmit={handleUploadSubmit}>
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Title</span>
              <input
                type="text"
                required
                value={formState.title}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Category</span>
              <select
                required
                value={formState.categoryId}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select</option>
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Department</span>
              <select
                required
                value={formState.departmentId}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select</option>
                {state.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Tags (comma separated)</span>
              <input
                type="text"
                value={formState.tags}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    tags: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">File</span>
              <input
                type="file"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    file: event.target.files?.[0] || null,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {isSaving ? 'Uploading...' : 'Save Document'}
            </button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
