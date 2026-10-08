const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
]

/**
 * Convert western number to Khmer numeral string
 * @param {number|string} num
 */
export function toKhmerNumerals(num) {
  if (num === null || num === undefined) return ''
  return String(num).replace(/\d/g, (d) => KHMER_DIGITS[parseInt(d, 10)])
}

/**
 * Format a date string or timestamp
 * @param {string|Date} dateVal
 * @param {string} locale ('km' | 'en')
 */
export function formatDate(dateVal, locale = 'km') {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return '—'

  if (locale === 'km') {
    const day = toKhmerNumerals(d.getDate())
    const month = KHMER_MONTHS[d.getMonth()]
    const year = toKhmerNumerals(d.getFullYear())
    return `${day} ${month} ${year}`
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date with time
 * @param {string|Date} dateVal
 * @param {string} locale ('km' | 'en')
 */
export function formatDateTime(dateVal, locale = 'km') {
  if (!dateVal) return '—'
  const d = new Date(dateVal)
  if (isNaN(d.getTime())) return '—'

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const timeStr = `${hours}:${minutes}`

  if (locale === 'km') {
    return `${formatDate(dateVal, 'km')} ម៉ោង ${toKhmerNumerals(timeStr)}`
  }

  return `${formatDate(dateVal, 'en')} at ${timeStr}`
}

/**
 * Format standard number with locale support
 * @param {number} num
 * @param {string} locale ('km' | 'en')
 */
export function formatNumber(num, locale = 'km') {
  if (num === null || num === undefined) return '0'
  if (locale === 'km') {
    return toKhmerNumerals(num.toLocaleString('en-US'))
  }
  return Number(num).toLocaleString('en-US')
}

/**
 * Format raw bytes into human-readable size
 * @param {number} bytes
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
