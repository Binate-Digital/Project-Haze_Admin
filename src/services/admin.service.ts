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
}
