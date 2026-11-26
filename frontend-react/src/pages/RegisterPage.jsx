import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import InputField from '../components/InputField'
import { useAuth } from '../context/AuthContext'
import { getApiError } from '../services/api'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/login', { replace: true, state: { message: 'Account created. Please log in.' } })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <span className="auth-kicker">GET STARTED</span>
      <h1>Create your account</h1>
      <p className="auth-subtitle">Set up your secure profile workspace.</p>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="auth-form" onSubmit={submit}>
        <InputField label="Email address" name="email" type="email" value={form.email} autoComplete="email" required onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <InputField label="Password" name="password" password value={form.password} autoComplete="new-password" minLength={8} required onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <button className="button button-primary auth-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </motion.section>
  )
}
