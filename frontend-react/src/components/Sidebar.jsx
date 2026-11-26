import { LayoutDashboard, UserRound, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div><strong>Profile</strong><span>Management</span></div>
          <button className="icon-button sidebar-close" type="button" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <NavLink to="/dashboard" onClick={onClose}><LayoutDashboard size={18} /><span>Dashboard</span></NavLink>
          <NavLink to="/profile" onClick={onClose}><UserRound size={18} /><span>Profile</span></NavLink>
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> Secure workspace
        </div>
      </aside>
    </>
  )
}
