export default function ProfileCard({ title, items = [], wide = false }) {
  return (
    <section className={`profile-card ${wide ? 'profile-card-wide' : ''}`}>
      {title && <h3>{title}</h3>}
      <dl>
        {items.map(({ label, value, href }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{href && value !== 'Not provided' ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
