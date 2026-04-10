export function Logo() {
  return (
    <div className="logo-wrap" aria-label="Bus ETA MVP logo">
      <svg viewBox="0 0 48 48" className="logo" role="img" aria-hidden="true">
        <rect x="4" y="10" width="30" height="24" rx="9" stroke="currentColor" strokeWidth="4" fill="none" />
        <path d="M34 18 L43 18 L43 30 L34 30" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="36" r="3" fill="currentColor" />
        <circle cx="30" cy="36" r="3" fill="currentColor" />
      </svg>
      <div>
        <strong>Bus ETA MVP</strong>
        <p>Citybus + KMB</p>
      </div>
    </div>
  )
}
