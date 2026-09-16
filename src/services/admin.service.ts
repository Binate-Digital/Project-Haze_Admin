import { api } from '@/services/api'
import type { ApiEnvelope } from '@/types/auth'

function unwrap<T>(data: ApiEnvelope<T>, fallback = 'Request failed'): T {
  if (!data.status) throw new Error(data.message || fallback)
  return data.data
}

export const adminApi = {
  // Businesses (TRD 3.2)
  getPendingBusinesses: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>(
      '/admin/get-pending-businesses',
    )
    return unwrap(data)
  },
  getBusinessDetails: async (businessId: string) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(
      `/admin/get-business-details/${businessId}`,
    )
    return unwrap(data)
  },
  approveBusiness: async (businessId: string) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(
      `/admin/approve-business/${businessId}`,
    )
    return unwrap(data, data.message)
  },
  rejectBusiness: async (businessId: string, rejectionReason: string) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(
      `/admin/reject-business/${businessId}`,
      { rejectionReason },
    )
    return unwrap(data, data.message)
  },

  // Blogs (TRD 3.4)
  getPendingBlogs: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/blogs/pending')
    return unwrap(data)
  },
  approveBlog: async (blogId: string) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/approve-blog/${blogId}`)
    return unwrap(data, data.message)
  },
  rejectBlog: async (blogId: string) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/reject-blog/${blogId}`)
    return unwrap(data, data.message)
  },
  setBlogFlags: async (
    blogId: string,
    flags: { isFeatured?: boolean; isTrending?: boolean; isActive?: boolean },
  ) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/blogs/${blogId}/flags`, flags)
    return unwrap(data, data.message)
  },

  // Education (TRD 3.4)
  getPendingContributions: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>(
      '/admin/education/contributions/pending',
    )
    return unwrap(data)
  },
  reviewContribution: async (
    contributionId: string,
    action: 'approve' | 'reject',
    adminNote?: string,
  ) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(
      `/admin/education/contributions/${contributionId}/review`,
      { action, adminNote },
    )
    return unwrap(data, data.message)
  },
  createCourse: async (form: FormData) => {
    const { data } = await api.post<ApiEnvelope<unknown>>('/admin/courses', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrap(data, data.message)
  },

  // Ads
  getPendingAds: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/ads/pending')
    return unwrap(data)
  },
  reviewAd: async (adId: string, action: 'approve' | 'reject' | 'pause') => {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/ads/${adId}/review`, { action })
    return unwrap(data, data.message)
  },

  // Packages
  getPackages: async (packageType?: string) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/packages', {
      params: packageType ? { packageType } : undefined,
    })
    return unwrap(data)
  },
  createPackage: async (payload: {
    packageName: string
    description: string
    price: number
    durationInDays: number
    features: string[]
    packageType?: 'store' | 'ads'
  }) => {
    const { data } = await api.post<ApiEnvelope<unknown>>('/admin/create-package', payload)
    return unwrap(data, data.message)
  },
  updatePackage: async (
    packageId: string,
    payload: Partial<{
      packageName: string
      description: string
      price: number
      durationInDays: number
      features: string[]
      isActive: boolean
      packageType: 'store' | 'ads'
    }>,
  ) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>(
      `/admin/update-package/${packageId}`,
      payload,
    )
    return unwrap(data, data.message)
  },
  deletePackage: async (packageId: string) => {
    const { data } = await api.delete<ApiEnvelope<unknown>>(`/admin/delete-package/${packageId}`)
    return unwrap(data, data.message)
  },

  // Legal
  getLegalContent: async (type?: string) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/legal-content', {
      params: type ? { type } : undefined,
    })
    return unwrap(data)
  },
  createLegalContent: async (payload: {
    title: string
    type: 'terms_conditions' | 'privacy_policy'
    content: string
  }) => {
    const { data } = await api.post<ApiEnvelope<unknown>>('/admin/create-legal-content', payload)
    return unwrap(data, data.message)
  },
  updateLegalContent: async (payload: {
    id: string
    title?: string
    type?: string
    content?: string
  }) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>('/admin/update-legal-content', payload)
    return unwrap(data, data.message)
  },
  deleteLegalContent: async (id: string) => {
    const { data } = await api.delete<ApiEnvelope<unknown>>(`/admin/delete-legal-content/${id}`)
    return unwrap(data, data.message)
  },

  // Profile
  getProfile: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/admin/profile')
    return unwrap(data)
  },
  updateProfile: async (form: FormData) => {
    const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>('/admin/profile', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrap(data, data.message)
  },
  updatePassword: async (payload: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    const { data } = await api.post<ApiEnvelope<unknown>>('/admin/update-password', payload)
    return unwrap(data, data.message)
  },

  // Analytics
  getAnalyticsOverview: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, number>>>('/admin/analytics/overview')
    return unwrap(data)
  },

  // Users
  listUsers: async (params?: { role?: string; q?: string }) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/users', {
      params,
    })
    return unwrap(data)
  },
  setUserBlocked: async (userId: string, blocked: boolean) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/users/${userId}/block`, {
      blocked,
    })
    return unwrap(data, data.message)
  },
  createSubAdmin: async (payload: { email: string; password: string; fullName?: string }) => {
    const { data } = await api.post<ApiEnvelope<unknown>>('/admin/users/sub-admin', payload)
    return unwrap(data, data.message)
  },

  // Push blast
  sendNotificationBlast: async (payload: {
    title: string
    body: string
    audience: 'all' | 'users' | 'business'
  }) => {
    const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(
      '/admin/notifications/blast',
      payload,
    )
    return unwrap(data, data.message)
  },

  // Reports
  listReports: async (status?: string) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/reports', {
      params: status ? { status } : undefined,
    })
    return unwrap(data)
  },
  reviewReport: async (
    reportId: string,
    payload: { status: 'reviewed' | 'dismissed' | 'pending'; blockUser?: boolean },
  ) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/reports/${reportId}`, payload)
    return unwrap(data, data.message)
  },

  // Orders / refunds
  listOrders: async (params?: { status?: string; paymentStatus?: string }) => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/orders', {
      params,
    })
    return unwrap(data)
  },
  refundOrder: async (orderId: string, reason?: string) => {
    const { data } = await api.post<ApiEnvelope<unknown>>(`/admin/orders/${orderId}/refund`, {
      reason,
    })
    return unwrap(data, data.message)
  },

  // Courses CMS
  listCourses: async () => {
    const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/admin/courses')
    return unwrap(data)
  },
  updateCourse: async (courseId: string, form: FormData) => {
    const { data } = await api.patch<ApiEnvelope<unknown>>(`/admin/courses/${courseId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return unwrap(data, data.message)
  },
  deleteCourse: async (courseId: string) => {
    const { data } = await api.delete<ApiEnvelope<unknown>>(`/admin/courses/${courseId}`)
    return unwrap(data, data.message)
  },
}
