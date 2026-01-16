import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from './store/userStore'
import GamePage from './pages/GamePage'
import LoginPage from './pages/LoginPage'
import InventoryPage from './pages/InventoryPage'
import ShopPage from './pages/ShopPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/ui/Layout'

function App() {
  const { isAuthenticated } = useUserStore()

  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/login" element={<LoginPage />} />

      {/* Защищённые маршруты */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<GamePage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
