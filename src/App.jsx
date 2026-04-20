import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import { ToastContainer } from './components/ToastContainer.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AdminLayout } from './layouts/AdminLayout.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { UserLayout } from './layouts/UserLayout.jsx'
import { CategoriesPage } from './pages/Admin/CategoriesPage.jsx'
import { DepartmentsPage } from './pages/Admin/DepartmentsPage.jsx'
import { UsersManagementPage } from './pages/Admin/UsersManagementPage.jsx'
import { DocumentDetailPage } from './pages/Documents/DocumentDetailPage.jsx'
import { DocumentListPage } from './pages/Documents/DocumentListPage.jsx'
import { LoginPage } from './pages/Login/LoginPage.jsx'

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '/',
    element: <Navigate to="/documents" replace />,
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute role="user">
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DocumentListPage />,
      },
      {
        path: ':id',
        element: <DocumentDetailPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="users" replace />,
      },
      {
        path: 'users',
        element: <UsersManagementPage />,
      },
      {
        path: 'departments',
        element: <DepartmentsPage />,
      },
      {
        path: 'categories',
        element: <CategoriesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  )
}

export default App
