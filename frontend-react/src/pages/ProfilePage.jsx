import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, KeyRound, Pencil, Trash2, Upload } from 'lucide-react'
import LoadingScreen from '../components/LoadingScreen'
import ProgressIndicator from '../components/ProgressIndicator'
import ProfileCard from '../components/ProfileCard'
import Modal from '../components/Modal'
import InputField from '../components/InputField'
import { authApi, getApiError, profileApi } from '../services/api'

const emptyProfile = {
  name: '',
  phone_number: '',
  date_of_birth: '',
  gender: '',
  is_jss_student: null,
  hobbies: [],
  interests: [],
  address: '',
  branch: '',
  linkedin_url: '',
  github_url: '',
  profile_picture_url: '',
}

const hobbies = ['Reading', 'Sports', 'Music', 'Travelling']
const interests = ['Technology', 'Programming', 'Business', 'Data Science']

export default function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [draft, setDraft] = useState(emptyProfile)
  const [editing, setEditing] = useState(location.state?.edit === true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pictureModal, setPictureModal] = useState(false)
  const [passwordModal, setPasswordModal] = useState(false)
  const [pictureFile, setPictureFile] = useState(null)

  const loadProfile = async () => {
    try {
      const { data } = await profileApi.get()
      setProfile(data)
      setDraft({ ...emptyProfile, ...data })
      setError('')
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setProfile(null)
        setDraft(emptyProfile)
      } else {
        setError(getApiError(requestError))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
  }

  const toggleList = (name, value) => {
    setDraft((current) => {
      const selected = current[name] || []
      return { ...current, [name]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] }
    })
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...draft,
        is_jss_student: draft.is_jss_student === true || draft.is_jss_student === 'true',
        linkedin_url: draft.linkedin_url || null,
        github_url: draft.github_url || null,
      }
      const { data } = await profileApi.save(payload)
      setProfile(data)
      setDraft({ ...emptyProfile, ...data })
      setEditing(false)
      setSuccess('Profile saved successfully.')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  const uploadPicture = async (event) => {
    event.preventDefault()
    if (!pictureFile) return setError('Select a JPG, PNG, or WebP image.')
    setError('')
    try {
      await profileApi.uploadPicture(pictureFile)
      await loadProfile()
      setPictureModal(false)
      setPictureFile(null)
      setSuccess('Profile picture uploaded.')
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  const deletePicture = async () => {
    setError('')
    try {
      await profileApi.deletePicture()
      await loadProfile()
      setSuccess('Profile picture deleted.')
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  if (loading) return <LoadingScreen label="Loading profile..." />

  const completion = profile?.completion?.percentage ?? 0
  const missing = profile?.completion?.missing_fields ?? []

  return (
    <div className="profile-page-react">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <AnimatePresence mode="wait">
        {!editing ? (
          <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="profile-view">
            <section className="profile-hero">
              <div className="profile-avatar">
                {profile?.profile_picture_url ? <img src={profile.profile_picture_url} alt={profile.name || 'Profile'} /> : <span>{profile?.name?.[0]?.toUpperCase() || 'P'}</span>}
                <button type="button" onClick={() => setPictureModal(true)} aria-label="Update profile picture"><Camera size={16} /></button>
              </div>
              <div className="profile-identity">
                <span className="section-kicker">STUDENT PROFILE</span>
                <h1>{profile?.name || 'Complete your profile'}</h1>
                <p>{profile?.branch ? `${profile.branch} Branch` : 'Branch not set'} <b>•</b> {profile?.is_jss_student ? 'JSS College' : 'JSS status not set'}</p>
              </div>
              <div className="profile-hero-actions">
                <button className="button button-primary" type="button" onClick={() => setEditing(true)}><Pencil size={16} /> Edit Profile</button>
                <button className="button button-ghost" type="button" onClick={() => setPasswordModal(true)}><KeyRound size={16} /> Change Password</button>
              </div>
              <ProgressIndicator percentage={completion} />
            </section>

            {missing.length > 0 && (
              <section className="missing-card">
                <div><span className="section-kicker">PROFILE COMPLETION</span><strong>{completion}% complete</strong></div>
                <p>Missing: {missing.join(', ')}</p>
              </section>
            )}

            <div className="profile-card-grid">
              <ProfileCard title="Personal Information" items={[
                { label: 'Name', value: profile?.name || 'Not provided' },
                { label: 'Gender', value: profile?.gender?.replaceAll('_', ' ') || 'Not provided' },
                { label: 'Date of Birth', value: profile?.date_of_birth || 'Not provided' },
                { label: 'JSS College', value: typeof profile?.is_jss_student === 'boolean' ? (profile.is_jss_student ? 'Yes' : 'No') : 'Not provided' },
              ]} />
              <ProfileCard title="Contact Information" items={[
                { label: 'Phone', value: profile?.phone_number || 'Not provided' },
                { label: 'Address', value: profile?.address || 'Not provided' },
              ]} />
              <ProfileCard title="Academic Details" items={[
                { label: 'Branch', value: profile?.branch || 'Not provided' },
                { label: 'Hobbies', value: profile?.hobbies?.join(', ') || 'None selected' },
                { label: 'Interests', value: profile?.interests?.join(', ') || 'None selected' },
              ]} />
              <ProfileCard title="Social Profiles" items={[
                { label: 'LinkedIn', value: profile?.linkedin_url || 'Not provided', href: profile?.linkedin_url },
                { label: 'GitHub', value: profile?.github_url || 'Not provided', href: profile?.github_url },
              ]} />
            </div>
          </motion.div>
        ) : (
          <motion.form key="edit" className="profile-edit" onSubmit={saveProfile} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="edit-heading"><div><span className="section-kicker">EDIT PROFILE</span><h1>Update your information</h1></div><button className="button button-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
            <div className="form-grid">
              <section className="profile-card form-section"><h3>Personal Information</h3>
                <div className="form-fields">
                  <InputField label="Full name" name="name" value={draft.name} required onChange={updateField} />
                  <InputField label="Phone number" name="phone_number" value={draft.phone_number} required onChange={updateField} />
                  <InputField label="Date of birth" name="date_of_birth" type="date" value={draft.date_of_birth} required onChange={updateField} />
                  <label className="field"><span>Gender</span><select name="gender" value={draft.gender} required onChange={updateField}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="non_binary">Non-binary</option><option value="other">Other</option><option value="prefer_not_to_say">Prefer not to say</option></select></label>
                  <fieldset className="choice-fieldset"><legend>Are you from JSS College?</legend><label><input type="radio" name="is_jss_student" value="true" checked={draft.is_jss_student === true || draft.is_jss_student === 'true'} onChange={updateField} /> Yes</label><label><input type="radio" name="is_jss_student" value="false" checked={draft.is_jss_student === false || draft.is_jss_student === 'false'} onChange={updateField} /> No</label></fieldset>
                </div>
              </section>
              <section className="profile-card form-section"><h3>Academic & Social</h3>
                <div className="form-fields">
                  <label className="field"><span>Branch</span><select name="branch" value={draft.branch} required onChange={updateField}><option value="">Select branch</option>{['ISE','CSE','ECE','MECH'].map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></label>
                  <InputField label="LinkedIn URL" name="linkedin_url" type="url" value={draft.linkedin_url || ''} placeholder="https://www.linkedin.com/in/username" onChange={updateField} />
                  <InputField label="GitHub URL" name="github_url" type="url" value={draft.github_url || ''} placeholder="https://github.com/username" onChange={updateField} />
                </div>
              </section>
              <section className="profile-card form-section form-wide"><h3>Hobbies & Interests</h3><div className="check-grid">
                <fieldset><legend>Hobbies</legend>{hobbies.map((item) => <label key={item}><input type="checkbox" checked={draft.hobbies?.includes(item)} onChange={() => toggleList('hobbies', item)} /> {item}</label>)}</fieldset>
                <fieldset><legend>Interests</legend>{interests.map((item) => <label key={item}><input type="checkbox" checked={draft.interests?.includes(item)} onChange={() => toggleList('interests', item)} /> {item}</label>)}</fieldset>
              </div></section>
              <section className="profile-card form-section form-wide"><h3>Address</h3><label className="field"><span>Permanent Address</span><textarea name="address" rows="4" value={draft.address} required onChange={updateField} /></label></section>
            </div>
            <div className="edit-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button><button className="button button-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button></div>
          </motion.form>
        )}
      </AnimatePresence>

      <Modal open={pictureModal} title="Profile picture" onClose={() => setPictureModal(false)}>
        <label className="picture-dropzone"><Upload /><strong>{pictureFile ? pictureFile.name : 'Choose an image'}</strong><span>JPG, PNG or WebP · Maximum 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPictureFile(event.target.files[0])} /></label>
        <div className="modal-actions">{profile?.profile_picture_url && <button className="button button-danger" type="button" onClick={deletePicture}><Trash2 size={16} /> Delete</button>}<button className="button button-primary" type="button" onClick={uploadPicture}><Camera size={16} /> Upload</button></div>
      </Modal>

      <ChangePasswordModal
        open={passwordModal}
        onClose={() => setPasswordModal(false)}
        onSuccess={() => {
          sessionStorage.removeItem('access_token')
          navigate('/login', { replace: true, state: { message: 'Password changed. Please log in.' } })
        }}
      />
    </div>
  )
}

function ChangePasswordModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ current_password: '', new_password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authApi.changePassword(form)
      onSuccess('Password changed successfully.')
      setForm({ current_password: '', new_password: '' })
      onClose()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} title="Change password" onClose={onClose}>
      {error && <div className="alert alert-error">{error}</div>}
      <form className="password-modal-form" onSubmit={submit}>
        <InputField label="Current password" name="current_password" password required value={form.current_password} onChange={(event) => setForm({ ...form, current_password: event.target.value })} />
        <InputField label="New password" name="new_password" password required minLength={8} value={form.new_password} onChange={(event) => setForm({ ...form, new_password: event.target.value })} />
        <button className="button button-primary" type="submit" disabled={loading}>{loading ? 'Changing...' : 'Change Password'}</button>
      </form>
    </Modal>
  )
}
