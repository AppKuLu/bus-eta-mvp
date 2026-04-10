export function minutesAway(eta: string | null): string {
  if (!eta) return '未有預報'
  const diff = Math.round((new Date(eta).getTime() - Date.now()) / 60000)
  if (diff <= 0) return '即將到站'
  return `${diff} 分鐘`
}

export function formatTime(eta: string | null): string {
  if (!eta) return '--'
  return new Date(eta).toLocaleTimeString('zh-HK', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
