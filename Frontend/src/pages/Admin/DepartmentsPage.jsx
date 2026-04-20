import { useCallback, useEffect, useState } from 'react'
import {
  createDepartment,
  getDepartments,
  updateDepartment,
} from '../../api/departments'
import { getUsers, patchUser } from '../../api/users'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Modal } from '../../components/Modal'
import { useApp } from '../../context/AppContext'
import { extractListData } from '../../utils/listResponse'

const initialForm = {
  name: '',
  description: '',
}

export function DepartmentsPage() {
  const { addNotification } = useApp()
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [formState, setFormState] = useState(initialForm)
  const [assignDepartment, setAssignDepartment] = useState(null)
  const [selectedUserIds, setSelectedUserIds] = useState([])

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const [departmentData, usersResponse] = await Promise.all([
        getDepartments(),
        getUsers(),
      ])
      setDepartments(departmentData)
      setUsers(extractListData(usersResponse.data))
    } catch {
      addNotification('Failed to load departments.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    loadData()
  }, [loadData])

  function openCreate() {
    setEditingDepartment(null)
    setFormState(initialForm)
    setIsModalOpen(true)
  }

  function openEdit(department) {
    setEditingDepartment(department)
    setFormState({
      name: department.name,
      description: department.description,
    })
    setIsModalOpen(true)
  }

  async function handleSaveDepartment(event) {
    event.preventDefault()

    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, {
          name: formState.name,
          description: formState.description,
        })
        addNotification('Department updated.')
      } else {
        await createDepartment({
          name: formState.name,
          description: formState.description,
          memberIds: [],
        })
        addNotification('Department created.')
      }

      setIsModalOpen(false)
      setEditingDepartment(null)
      setFormState(initialForm)
      await loadData()
    } catch {
      addNotification('Failed to save department.', 'error')
    }
  }

  function openAssignUsers(department) {
    setAssignDepartment(department)
    setSelectedUserIds([])
  }

  async function handleAssignUsers(event) {
    event.preventDefault()

    if (!assignDepartment || !selectedUserIds.length) {
      setAssignDepartment(null)
      return
    }

    try {
      const existingIds = assignDepartment.memberIds || []
      const mergedIds = Array.from(new Set([...existingIds, ...selectedUserIds]))

      await updateDepartment(assignDepartment.id, {
        memberIds: mergedIds,
      })

      await Promise.all(
        selectedUserIds.map((userId) => patchUser(userId, { departmentId: assignDepartment.id })),
      )

      addNotification('Users assigned to department.')
      setAssignDepartment(null)
      setSelectedUserIds([])
      await loadData()
    } catch {
      addNotification('Failed to assign users.', 'error')
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading departments..." />
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Departments</h2>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
        >
          Create Department
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {departments.map((department) => (
          <article
            key={department.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">{department.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{department.description}</p>
            <p className="mt-2 text-sm text-slate-500">
              Members: {department.memberIds?.length || 0}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(department)}
                className="rounded bg-slate-100 px-3 py-1 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => openAssignUsers(department)}
                className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
              >
                Assign Users
              </button>
            </div>
          </article>
        ))}
      </div>

      {isModalOpen ? (
        <Modal
          title={editingDepartment ? 'Edit Department' : 'Create Department'}
          onClose={() => {
            setIsModalOpen(false)
            setEditingDepartment(null)
            setFormState(initialForm)
          }}
        >
          <form className="space-y-3" onSubmit={handleSaveDepartment}>
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

      {assignDepartment ? (
        <Modal
          title={`Assign Users: ${assignDepartment.name}`}
          onClose={() => {
            setAssignDepartment(null)
            setSelectedUserIds([])
          }}
        >
          <form className="space-y-3" onSubmit={handleAssignUsers}>
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {users
                .filter(
                  (user) => !assignDepartment.memberIds?.includes(Number(user.id)),
                )
                .map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(Number(user.id))}
                      onChange={(event) => {
                        setSelectedUserIds((current) => {
                          if (event.target.checked) {
                            return [...current, Number(user.id)]
                          }

                          return current.filter((id) => id !== Number(user.id))
                        })
                      }}
                    />
                    <span>{user.name}</span>
                  </label>
                ))}
            </div>
            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Confirm Assignment
            </button>
          </form>
        </Modal>
      ) : null}
    </section>
  )
}
