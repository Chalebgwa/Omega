import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CreateEntryPage } from './pages/CreateEntryPage'
import { CreateMessagePage } from './pages/CreateMessagePage'
import { DashboardPage } from './pages/DashboardPage'
import { EditEntryPage } from './pages/EditEntryPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PublicPage } from './pages/PublicPage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/public" element={<PublicPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/create-message"
        element={
          <ProtectedRoute>
            <CreateMessagePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/create-entry"
        element={
          <ProtectedRoute>
            <CreateEntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/edit-entry/:entryId"
        element={
          <ProtectedRoute>
            <EditEntryPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
