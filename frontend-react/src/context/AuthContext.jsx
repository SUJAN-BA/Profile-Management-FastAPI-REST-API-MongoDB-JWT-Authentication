import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, TOKEN_KEY } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(({ data }) => setUser(data))
      .catch(() => sessionStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    sessionStorage.setItem(TOKEN_KEY, data.access_token)
    const me = await authApi.me()
    setUser(me.data)
  }

  const register = (details) => authApi.register(details)

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      sessionStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
