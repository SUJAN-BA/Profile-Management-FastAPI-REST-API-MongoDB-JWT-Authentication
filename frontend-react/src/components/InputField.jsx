import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function InputField({ label, error, type = 'text', name, password = false, ...props }) {
  const [visible, setVisible] = useState(false)
  const inputType = password ? (visible ? 'text' : 'password') : type
  return (
    <label className={`field ${error ? 'field-error' : ''}`}>
      <span>{label}</span>
      <div className="input-shell">
        <input name={name} type={inputType} {...props} />
        {password && (
          <button type="button" className="password-toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <small>{error}</small>}
    </label>
  )
}
