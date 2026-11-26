import { Menu } from 'lucide-react'

export default function Navbar({ title, onMenu, onLogout, email }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" type="button" onClick={onMenu} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <div>
        <span className="topbar-eyebrow">Profile management</span>
        <h2>{title}</h2>
      </div>
      <div className="topbar-actions">
        <span className="topbar-email">{email}</span>
        <button className="button button-ghost" type="button" onClick={onLogout}>Logout</button>
      </div>
    </header>
  )
}
