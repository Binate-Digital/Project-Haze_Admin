import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthLayout } from '@/layouts/AuthLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { GuestRoute, ProtectedRoute } from '@/routes/guards'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import DashboardPage from '@/pages/DashboardPage'
import BusinessesPage from '@/pages/businesses/BusinessesPage'
import BusinessDetailPage from '@/pages/businesses/BusinessDetailPage'
import BlogsPage from '@/pages/blogs/BlogsPage'
import EducationPage from '@/pages/education/EducationPage'
import AdsPage from '@/pages/ads/AdsPage'
import PackagesPage from '@/pages/packages/PackagesPage'
import LegalPage from '@/pages/legal/LegalPage'
import { useAuthStore } from '@/store/auth.store'
import { ROUTES } from '@/config'

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.BUSINESSES} element={<BusinessesPage />} />
            <Route path={ROUTES.BUSINESS_DETAIL} element={<BusinessDetailPage />} />
            <Route path={ROUTES.BLOGS} element={<BlogsPage />} />
            <Route path={ROUTES.EDUCATION} element={<EducationPage />} />
            <Route path={ROUTES.ADS} element={<AdsPage />} />
            <Route path={ROUTES.PACKAGES} element={<PackagesPage />} />
            <Route path={ROUTES.LEGAL} element={<LegalPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
