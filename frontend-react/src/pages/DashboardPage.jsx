import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Pencil, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingScreen from '../components/LoadingScreen'
import ProgressIndicator from '../components/ProgressIndicator'
import { profileApi, getApiError } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    profileApi.get()
      .then(({ data }) => setProfile(data))
      .catch((requestError) => {
        if (requestError.response?.status !== 404) setError(getApiError(requestError))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Preparing dashboard..." />

  const completion = profile?.completion?.percentage ?? 0
  return (
    <div className="dashboard">
      {error && <div className="alert alert-error">{error}</div>}
      <motion.section className="welcome-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="section-kicker">OVERVIEW</span>
          <h1>Welcome{profile?.name ? `, ${profile.name}` : ''}</h1>
          <p>Keep your academic and professional profile complete.</p>
        </div>
        <div className="welcome-avatar">{profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt="" /> : <UserRound />}</div>
      </motion.section>

      <div className="dashboard-grid">
        <motion.section className="card completion-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div>
            <span className="section-kicker">PROFILE STATUS</span>
            <h2>{completion === 100 ? 'Profile complete' : 'Profile in progress'}</h2>
            <p>{profile?.completion?.missing_fields?.length ? `${profile.completion.missing_fields.length} fields remaining` : 'All fields are complete'}</p>
          </div>
          <ProgressIndicator percentage={completion} />
        </motion.section>

        <motion.section className="card account-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <span className="section-kicker">ACCOUNT</span>
          <h2>Student profile</h2>
          <dl>
            <div><dt>Email</dt><dd>{user?.email || '—'}</dd></div>
            <div><dt>Branch</dt><dd>{profile?.branch || 'Not set'}</dd></div>
          </dl>
        </motion.section>
      </div>

      <div className="quick-actions">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}>
          <Link className="action-card" to="/profile"><div className="action-icon"><UserRound /></div><div><span>View profile</span><p>Review your saved information</p></div><ArrowRight /></Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <Link className="action-card" to="/profile" state={{ edit: true }}><div className="action-icon action-icon-blue"><Pencil /></div><div><span>Edit profile</span><p>Update your details</p></div><ArrowRight /></Link>
        </motion.div>
      </div>
    </div>
  )
}
