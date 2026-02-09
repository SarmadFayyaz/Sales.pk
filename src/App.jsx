import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="px-4 py-6">
            <Routes>
              <Route path="/" element={<div className="max-w-6xl mx-auto"><Home /></div>} />
              <Route path="/login" element={<div className="max-w-6xl mx-auto"><Login /></div>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="max-w-7xl mx-auto">
                    <Dashboard />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
