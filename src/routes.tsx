import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/layout/AppLayout'
import ProductsPage from './pages/ProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import InventoryPage from './pages/InventoryPage'
import PosPage from './pages/PosPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import CustomersPage from './pages/CustomersPage'
import PromotionsPage from './pages/PromotionsPage'
// import PosPage from './pages/PosPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="sales" element={<SalesHistoryPage />} />
        <Route path="customers" element={<CustomersPage />} />  
        <Route path="promotions" element={<PromotionsPage />} />
      </Route>
    </Routes>
  )
}