import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import InputField from '../components/InputField'
import { useAuth } from '../context/AuthContext'
import { getApiError } from '../services/api'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const registrationMessage = location.state?.message

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <span className="auth-kicker">WELCOME BACK</span>
      <h1>Sign in to your account</h1>
      <p className="auth-subtitle">Enter your details to continue.</p>
      {registrationMessage && <div className="alert alert-success">{registrationMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <InputField label="Email address" name="email" type="email" value={form.email} autoComplete="email" required onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <InputField label="Password" name="password" password value={form.password} autoComplete="current-password" required onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">New here? <Link to="/register">Create an account</Link></p>
    </motion.section>
  )
}
