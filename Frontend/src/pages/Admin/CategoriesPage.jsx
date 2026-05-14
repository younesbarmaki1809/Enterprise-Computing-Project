import { useCallback, useEffect, useState } from 'react'
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../api/categories'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Modal } from '../../components/Modal'
import { useApp } from '../../context/AppContext'

const initialForm = {
  name: '',
  color: '#3b82f6',
  description: '',
}

export function CategoriesPage() {
  const { addNotification } = useApp()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [formState, setFormState] = useState(initialForm)

  const loadCategories = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await getCategories()
      setCategories(data)
    } catch {
      addNotification('Failed to load categories.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  function openCreate() {
    setEditingCategory(null)
    setFormState(initialForm)
    setIsModalOpen(true)
  }

  function openEdit(category) {
    setEditingCategory(category)
    setFormState({
      name: category.name,
      color: category.color,
      description: category.description,
    })
    setIsModalOpen(true)
  }

  async function handleSaveCategory(event) {
    event.preventDefault()

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formState)
        addNotification('Category updated.')
      } else {
        await createCategory(formState)
        addNotification('Category created.')
      }

      setIsModalOpen(false)
      setEditingCategory(null)
      setFormState(initialForm)
      await loadCategories()
    } catch {
      addNotification('Failed to save category.', 'error')
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) {
      return
    }

    try {
      await deleteCategory(categoryToDelete.id)
      addNotification('Category deleted.')
      setCategoryToDelete(null)
      await loadCategories()
    } catch {
      addNotification('Failed to delete category.', 'error')
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading categories..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Categories</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
        >
          Create Category
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full border border-slate-200"
                style={{ backgroundColor: category.color }}
              />
              <h3 className="text-lg font-semibold text-slate-900">{category.name}</h3>
            </div>
            <p className="text-sm text-slate-600">{category.description}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(category)}
                className="rounded bg-slate-100 px-3 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setCategoryToDelete(category)}
                className="rounded bg-rose-600 px-3 py-1 text-sm text-white"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <Modal
          title={editingCategory ? 'Edit Category' : 'Create Category'}
          onClose={() => {
            setIsModalOpen(false)
            setEditingCategory(null)
            setFormState(initialForm)
          }}
        >
          <form className="space-y-3" onSubmit={handleSaveCategory}>
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Name</span>
              <input
                required
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Color</span>
              <input
                type="color"
                value={formState.color}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    color: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-slate-300 px-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Description</span>
              <textarea
                required
                value={formState.description}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Save
            </button>
          </form>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(categoryToDelete)}
        title="Delete Category"
        message={`Delete ${categoryToDelete?.name}? This action cannot be undone.`}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        confirmText="Delete"
      />
    </section>
  )
}
