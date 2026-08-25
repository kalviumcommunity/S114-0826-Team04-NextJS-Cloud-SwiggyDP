import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute({ role }) { const { user, loading } = useAuth(); if (loading) return <div className="loading-screen">Restoring your workspace...</div>; if (!user) return <Navigate to="/" replace />; return role && user.role !== role ? <Navigate to={`/${user.role === 'customer' ? 'customer' : 'partner'}/dashboard`} replace /> : <Outlet /> }
