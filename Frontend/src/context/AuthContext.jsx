import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('batchflow_user') || 'null'))
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('batchflow_token')))
  useEffect(() => { if (!loading) return; api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => logout()).finally(() => setLoading(false)) }, [])
  async function authenticate(path, payload) { const { data } = await api.post(path, payload); localStorage.setItem('batchflow_token', data.token); localStorage.setItem('batchflow_user', JSON.stringify(data.user)); setUser(data.user); return data.user }
  function logout() { localStorage.removeItem('batchflow_token'); localStorage.removeItem('batchflow_user'); setUser(null); setLoading(false) }
  return <AuthContext.Provider value={{ user, loading, authenticate, logout }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
