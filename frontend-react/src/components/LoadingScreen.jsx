export default function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="loading-screen" role="status">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}
