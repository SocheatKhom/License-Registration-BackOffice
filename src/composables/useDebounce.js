import { ref, watch } from 'vue'

export function useDebounce(sourceRef, delay = 400) {
  const debouncedValue = ref(sourceRef.value)
  let timeoutId = null

  watch(sourceRef, (newVal) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}
