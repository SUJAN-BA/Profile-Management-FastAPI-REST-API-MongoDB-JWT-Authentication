import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <main className="auth-layout">
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />
      <section className="auth-brand">
        <div className="brand-mark brand-mark-large">P</div>
        <span>PROFILE SYSTEM</span>
        <h1>Manage your identity,<br />beautifully.</h1>
        <p>A secure, modern workspace for all your profile and academic details.</p>
      </section>
      <Outlet />
    </main>
  )
}
