export function formatTime(value?: string) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

export function shortId(value?: string) {
  if (!value) return '-'
  return value.slice(-8).toUpperCase()
}
