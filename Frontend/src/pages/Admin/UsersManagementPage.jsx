import { useCallback, useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import { createUser, getUsers, patchUser, updateUser } from '../../api/users'
import { Badge } from '../../components/Badge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { Modal } from '../../components/Modal'
import { Pagination } from '../../components/Pagination'
import { Table } from '../../components/Table'
import { useApp } from '../../context/AppContext'
import { exportRowsToCSV } from '../../utils/exportCSV'
import { extractListData, extractTotalPages } from '../../utils/listResponse'

const PAGE_SIZE = 8
const CSV_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'password', label: 'Password', required: true },
  { key: 'role', label: 'Role', required: true },
  { key: 'departmentId', label: 'Department', required: true },
]

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  departmentId: '',
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '')
}

function guessColumnMap(headers) {
  const guesses = {
    name: ['name', 'fullname', 'username'],
    email: ['email', 'mail'],
    password: ['password', 'pass'],
    role: ['role', 'usertype'],
    departmentId: ['departmentid', 'department', 'deptid', 'dept'],
  }

  return Object.fromEntries(
    Object.entries(guesses).map(([field, aliases]) => {
      const header = headers.find((item) => {
        const normalized = normalizeText(item)
        return aliases.includes(normalized)
      })

      return [field, header || '']
    }),
  )
}

function normalizeRole(value) {
  const role = String(value || '').trim().toLowerCase()

  return role === 'admin' ? 'admin' : 'user'
}

function resolveDepartmentId(value, departments) {
  const raw = String(value || '').trim()

  if (!raw) {
    return null
  }

  const numeric = Number(raw)

  if (Number.isFinite(numeric)) {
    const exists = departments.some(
      (department) => Number(department.id) === Number(numeric),
    )

    return exists ? numeric : null
  }

  const byName = departments.find(
    (department) => normalizeText(department.name) === normalizeText(raw),
  )

  return byName ? Number(byName.id) : null
}

function validateMappedRow(row, columnMap, departments) {
  const name = String(row[columnMap.name] || '').trim()
  const email = String(row[columnMap.email] || '').trim().toLowerCase()
  const password = String(row[columnMap.password] || '').trim()
  const role = normalizeRole(row[columnMap.role])
  const departmentId = resolveDepartmentId(row[columnMap.departmentId], departments)

  if (!name) {
    return { isValid: false, error: 'missing name' }
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { isValid: false, error: 'invalid email' }
  }

  if (!password) {
    return { isValid: false, error: 'missing password' }
  }

  if (!departmentId) {
    return { isValid: false, error: 'invalid department' }
  }

  return {
    isValid: true,
    user: {
      name,
      email,
      password,
      role,
      departmentId,
    },
  }
}

export function UsersManagementPage() {
  const { state, addNotification } = useApp()

  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formState, setFormState] = useState(initialForm)
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvRows, setCsvRows] = useState([])
  const [columnMap, setColumnMap] = useState({})
  const [isImporting, setIsImporting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await getUsers({
        _page: page,
        _per_page: PAGE_SIZE,
      })
      const nextUsers = extractListData(response.data)

      setUsers(nextUsers)
      setTotalPages(extractTotalPages(response, PAGE_SIZE, nextUsers))
    } catch {
      addNotification('Failed to load users.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [addNotification, page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const selectedUsers = useMemo(
    () => users.filter((user) => selectedIds.includes(Number(user.id))),
    [selectedIds, users],
  )

  function openCreateModal() {
    setEditingUser(null)
    setFormState(initialForm)
    setIsModalOpen(true)
  }

  function openImportWizard() {
    setIsImportWizardOpen(true)
    setWizardStep(1)
    setCsvHeaders([])
    setCsvRows([])
    setColumnMap({})
    setIsImporting(false)
  }

  function closeImportWizard() {
    setIsImportWizardOpen(false)
    setWizardStep(1)
    setCsvHeaders([])
    setCsvRows([])
    setColumnMap({})
    setIsImporting(false)
  }

  function openEditModal(user) {
    setEditingUser(user)
    setFormState({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      departmentId: String(user.departmentId || ''),
    })
    setIsModalOpen(true)
  }

  function toggleSelection(userId) {
    setSelectedIds((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId)
      }

      return [...current, userId]
    })
  }

  async function handleBulkSuspend() {
    try {
      await Promise.all(
        selectedIds.map((id) => patchUser(id, { status: 'suspended' })),
      )
      addNotification('Selected users suspended.')
      setSelectedIds([])
      await loadUsers()
    } catch {
      addNotification('Failed to suspend selected users.', 'error')
    }
  }

  function handleExportSelected() {
    const rows = selectedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      status: user.status,
    }))

    exportRowsToCSV(rows, 'selected-users.csv')
  }

  async function handleToggleStatus(user) {
    try {
      const nextStatus = user.status === 'active' ? 'suspended' : 'active'
      await patchUser(user.id, { status: nextStatus })
      addNotification('User status updated.')
      await loadUsers()
    } catch {
      addNotification('Failed to update user status.', 'error')
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault()

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          ...editingUser,
          ...formState,
          departmentId: Number(formState.departmentId),
        })
        addNotification('User updated.')
      } else {
        await createUser({
          ...formState,
          departmentId: Number(formState.departmentId),
          status: 'active',
          avatarUrl: `https://i.pravatar.cc/150?u=${formState.email}`,
        })
        addNotification('User created.')
      }

      setIsModalOpen(false)
      setEditingUser(null)
      setFormState(initialForm)
      await loadUsers()
    } catch {
      addNotification('Failed to save user.', 'error')
    }
  }

  function handleCsvUpload(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = Array.isArray(result.data)
          ? result.data.filter((row) =>
              Object.values(row).some((value) => String(value || '').trim() !== ''),
            )
          : []

        const headers = result.meta?.fields || Object.keys(rows[0] || {})

        if (!headers.length || !rows.length) {
          addNotification('CSV has no usable rows.', 'error')
          return
        }

        setCsvHeaders(headers)
        setCsvRows(rows)
        setColumnMap(guessColumnMap(headers))
        setWizardStep(2)
      },
      error: () => {
        addNotification('Failed to parse CSV file.', 'error')
      },
    })
  }

  const canProceedToConfirm = useMemo(
    () =>
      CSV_FIELDS.every(
        (field) => !field.required || Boolean(String(columnMap[field.key] || '').trim()),
      ),
    [columnMap],
  )

  const importPreviewRows = useMemo(() => csvRows.slice(0, 6), [csvRows])

  const importAnalysis = useMemo(() => {
    const validUsers = []
    const errors = []

    csvRows.forEach((row, index) => {
      const result = validateMappedRow(row, columnMap, state.departments)

      if (result.isValid) {
        validUsers.push(result.user)
      } else {
        errors.push(`Row ${index + 2}: ${result.error}`)
      }
    })

    return {
      validUsers,
      errors,
    }
  }, [columnMap, csvRows, state.departments])

  async function handleConfirmImport() {
    if (!importAnalysis.validUsers.length) {
      addNotification('No valid rows to import.', 'error')
      return
    }

    setIsImporting(true)

    try {
      const existingUsersResponse = await getUsers()
      const existingUsers = extractListData(existingUsersResponse.data)
      const existingEmails = new Set(
        existingUsers.map((user) => String(user.email || '').toLowerCase()),
      )

      let importedCount = 0
      let skippedCount = 0

      for (const csvUser of importAnalysis.validUsers) {
        if (existingEmails.has(csvUser.email)) {
          skippedCount += 1
          continue
        }

        await createUser({
          ...csvUser,
          status: 'active',
          avatarUrl: `https://i.pravatar.cc/150?u=${csvUser.email}`,
        })

        existingEmails.add(csvUser.email)
        importedCount += 1
      }

      addNotification(
        `Imported ${importedCount} users${
          skippedCount ? `, skipped ${skippedCount} duplicate emails` : ''
        }.`,
      )

      closeImportWizard()
      await loadUsers()
    } catch {
      addNotification('Failed to import CSV users.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading users..." />
  }

  const columns = [
    {
      key: 'select',
      label: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(Number(row.id))}
          onChange={() => toggleSelection(Number(row.id))}
        />
      ),
    },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (row) => <Badge value={row.role} />,
    },
    {
      key: 'departmentId',
      label: 'Department',
      render: (row) => {
        const department = state.departments.find(
          (item) => Number(item.id) === Number(row.departmentId),
        )
        return department?.name || 'N/A'
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge value={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded bg-slate-100 px-2 py-1 text-xs"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className="rounded bg-slate-900 px-2 py-1 text-xs text-white"
          >
            {row.status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Users Management</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openImportWizard}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            Import CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Create User
          </button>
        </div>
      </div>

      {selectedIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <span className="text-sm text-blue-800">{selectedIds.length} selected</span>
          <button
            type="button"
            onClick={handleBulkSuspend}
            className="rounded bg-rose-600 px-3 py-1 text-xs text-white"
          >
            Suspend Selected
          </button>
          <button
            type="button"
            onClick={handleExportSelected}
            className="rounded bg-slate-800 px-3 py-1 text-xs text-white"
          >
            Export Selected
          </button>
        </div>
      ) : null}

      <Table columns={columns} rows={users} rowKey="id" />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {isModalOpen ? (
        <Modal
          title={editingUser ? 'Edit User' : 'Create User'}
          onClose={() => {
            setIsModalOpen(false)
            setEditingUser(null)
            setFormState(initialForm)
          }}
        >
          <form className="space-y-3" onSubmit={handleFormSubmit}>
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
              <span className="mb-1 block">Email</span>
              <input
                type="email"
                required
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Password</span>
              <input
                type="password"
                required
                value={formState.password}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="block text-sm text-slate-700">
              <span className="mb-1 block">Role</span>
              <select
                value={formState.role}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
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
                <option value="">Select department</option>
                {state.departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-white">
              Save
            </button>
          </form>
        </Modal>
      ) : null}

      {isImportWizardOpen ? (
        <Modal title="Import Users from CSV" onClose={closeImportWizard}>
          <div className="mb-4 flex items-center gap-2 text-sm">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`rounded-full px-3 py-1 ${
                  wizardStep === step
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Step {step}
              </div>
            ))}
          </div>

          {wizardStep === 1 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Upload a CSV file with columns for name, email, password, role and
                department.
              </p>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvUpload}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          ) : null}

          {wizardStep === 2 ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {CSV_FIELDS.map((field) => (
                  <label key={field.key} className="block text-sm text-slate-700">
                    <span className="mb-1 block">{field.label} column</span>
                    <select
                      value={columnMap[field.key] || ''}
                      onChange={(event) =>
                        setColumnMap((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="">Not mapped</option>
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200">
                <div className="border-b bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  CSV Preview
                </div>
                <div className="max-h-52 overflow-auto p-3 text-xs text-slate-600">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        {csvHeaders.map((header) => (
                          <th key={header} className="px-2 py-1 text-left">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreviewRows.map((row, index) => (
                        <tr key={String(index)}>
                          {csvHeaders.map((header) => (
                            <td key={header} className="px-2 py-1">
                              {String(row[header] || '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canProceedToConfirm}
                  onClick={() => setWizardStep(3)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}

          {wizardStep === 3 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p>Valid rows: {importAnalysis.validUsers.length}</p>
                <p>Rows with errors: {importAnalysis.errors.length}</p>
              </div>

              {importAnalysis.errors.length ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <p className="mb-2 font-medium">Validation Issues</p>
                  <ul className="list-disc space-y-1 pl-4">
                    {importAnalysis.errors.slice(0, 8).map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isImporting || !importAnalysis.validUsers.length}
                  onClick={handleConfirmImport}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  {isImporting ? 'Importing...' : 'Confirm & Import'}
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </section>
  )
}
