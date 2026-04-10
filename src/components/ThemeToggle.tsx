export function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button className="icon-button" onClick={onToggle} aria-label="切換深色模式">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
