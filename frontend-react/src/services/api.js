import axios from 'axios'

export const TOKEN_KEY = 'access_token'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

export const profileApi = {
  get: () => api.get('/profile/'),
  save: (data) => api.put('/profile/', data),
  completion: () => api.get('/profile/completion'),
  uploadPicture: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/profile/picture', form)
  },
  deletePicture: () => api.delete('/profile/picture'),
}

export function getApiError(error) {
  return error.response?.data?.detail || error.message || 'Something went wrong.'
}
