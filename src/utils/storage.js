export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (!item) return defaultValue
      try {
        return JSON.parse(item)
      } catch {
        return item
      }
    } catch {
      return defaultValue
    }
  },
  set(key, value) {
    try {
      if (typeof value === 'string') {
        localStorage.setItem(key, value)
      } else {
        localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (e) {
      console.error('Error saving to storage:', e)
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Error removing from storage:', e)
    }
  },
  clear() {
    try {
      localStorage.clear()
    } catch (e) {
      console.error('Error clearing storage:', e)
    }
  },
}
