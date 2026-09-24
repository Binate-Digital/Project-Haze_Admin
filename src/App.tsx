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
import BlogFormPage from '@/pages/blogs/BlogFormPage'
import EducationPage from '@/pages/education/EducationPage'
import CreateCoursePage from '@/pages/education/CreateCoursePage'
import ContributionsPage from '@/pages/education/ContributionsPage'
import AdsPage from '@/pages/ads/AdsPage'
import PackagesPage from '@/pages/packages/PackagesPage'
import PackageFormPage from '@/pages/packages/PackageFormPage'
import LegalPage from '@/pages/legal/LegalPage'
import LegalFormPage from '@/pages/legal/LegalFormPage'
import UsersPage from '@/pages/users/UsersPage'
import CreateSubAdminPage from '@/pages/users/CreateSubAdminPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import OrdersPage from '@/pages/orders/OrdersPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import LoyaltyCouponsPage from '@/pages/loyalty-coupons/LoyaltyCouponsPage'
import LoyaltyCouponFormPage from '@/pages/loyalty-coupons/LoyaltyCouponFormPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import UpdatePasswordPage from '@/pages/profile/UpdatePasswordPage'
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
            <Route path={ROUTES.ANALYTICS} element={<AnalyticsPage />} />
            <Route path={ROUTES.BUSINESSES} element={<BusinessesPage />} />
            <Route path={ROUTES.BUSINESS_DETAIL} element={<BusinessDetailPage />} />
            <Route path={ROUTES.USERS} element={<UsersPage />} />
            <Route path={ROUTES.USERS_CREATE_SUBADMIN} element={<CreateSubAdminPage />} />
            <Route path={ROUTES.BLOGS} element={<BlogsPage />} />
            <Route path={ROUTES.BLOGS_CREATE} element={<BlogFormPage />} />
            <Route path={ROUTES.BLOGS_EDIT} element={<BlogFormPage />} />
            <Route path={ROUTES.EDUCATION} element={<EducationPage />} />
            <Route path={ROUTES.EDUCATION_CREATE} element={<CreateCoursePage />} />
            <Route path={ROUTES.EDUCATION_CONTRIBUTIONS} element={<ContributionsPage />} />
            <Route path={ROUTES.ADS} element={<AdsPage />} />
            <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
            <Route path={ROUTES.PACKAGES} element={<PackagesPage />} />
            <Route path={ROUTES.PACKAGES_CREATE} element={<PackageFormPage />} />
            <Route path={ROUTES.PACKAGES_EDIT} element={<PackageFormPage />} />
            <Route path={ROUTES.LOYALTY_COUPONS} element={<LoyaltyCouponsPage />} />
            <Route path={ROUTES.LOYALTY_COUPONS_CREATE} element={<LoyaltyCouponFormPage />} />
            <Route path={ROUTES.LOYALTY_COUPONS_EDIT} element={<LoyaltyCouponFormPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
            <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
            <Route path={ROUTES.LEGAL} element={<LegalPage />} />
            <Route path={ROUTES.LEGAL_CREATE} element={<LegalFormPage />} />
            <Route path={ROUTES.LEGAL_EDIT} element={<LegalFormPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.UPDATE_PASSWORD} element={<UpdatePasswordPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
