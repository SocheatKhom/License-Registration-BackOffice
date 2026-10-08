<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/locales'

const props = defineProps({
  showFullName: {
    type: Boolean,
    default: false,
  },
})

const { locale } = useI18n()

function switchLanguage(lang) {
  setLocale(lang)
}
</script>

<template>
  <div class="inline-flex rounded border border-slate-300 bg-white p-0.5 text-xs select-none" role="group" aria-label="Language selector">
    <!-- Khmer Button with Cambodian Flag -->
    <button
      type="button"
      @click="switchLanguage('km')"
      :class="[
        'inline-flex items-center gap-1.5 px-2.5 py-1 font-medium rounded transition-colors',
        locale === 'km'
          ? 'bg-blue-900 text-white font-semibold'
          : 'text-slate-700 hover:bg-slate-100'
      ]"
      :aria-pressed="locale === 'km'"
      title="ភាសាខ្មែរ (Khmer)"
    >
      <!-- Cambodian Flag SVG -->
      <svg
        class="w-4 h-2.5 rounded-[1px] shrink-0 border border-slate-400/30 overflow-hidden"
        viewBox="0 0 640 480"
        aria-hidden="true"
      >
        <!-- Blue Top Band -->
        <rect width="640" height="480" fill="#032ea1" />
        <!-- Red Center Band -->
        <rect width="640" height="240" y="120" fill="#e00025" />
        <!-- White Angkor Wat Silhouette -->
        <g fill="#ffffff">
          <!-- Central Tower -->
          <polygon points="320,165 306,215 334,215" />
          <polygon points="320,185 302,230 338,230" />
          <!-- Left Tower -->
          <polygon points="275,190 263,230 287,230" />
          <!-- Right Tower -->
          <polygon points="365,190 353,230 377,230" />
          <!-- Base Tiers -->
          <rect x="250" y="230" width="140" height="20" />
          <rect x="230" y="250" width="180" height="22" />
          <rect x="210" y="272" width="220" height="24" />
          <!-- Gateway/Door arches -->
          <rect x="312" y="276" width="16" height="20" fill="#e00025" />
          <rect x="264" y="276" width="12" height="20" fill="#e00025" />
          <rect x="364" y="276" width="12" height="20" fill="#e00025" />
        </g>
      </svg>
      <span>ខ្មែរ</span>
    </button>

    <!-- English Button with UK Flag -->
    <button
      type="button"
      @click="switchLanguage('en')"
      :class="[
        'inline-flex items-center gap-1.5 px-2.5 py-1 font-medium rounded transition-colors',
        locale === 'en'
          ? 'bg-blue-900 text-white font-semibold'
          : 'text-slate-700 hover:bg-slate-100'
      ]"
      :aria-pressed="locale === 'en'"
      title="English"
    >
      <!-- UK Flag SVG -->
      <svg
        class="w-4 h-2.5 rounded-[1px] shrink-0 border border-slate-400/30 overflow-hidden"
        viewBox="0 0 640 480"
        aria-hidden="true"
      >
        <path fill="#012169" d="M0 0h640v480H0z"/>
        <path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z"/>
        <path fill="#C8102E" d="m424 288 216 156v36L376 288h48zm-128 0 72 48-24 16-96-64h48zm-96-96L0 36V0l264 192h-64zm144 0-72-48 24-16 96 64h-48z"/>
        <path fill="#FFF" d="M240 0h160v480H240zM0 160h640v160H0z"/>
        <path fill="#C8102E" d="M264 0h112v480H264zM0 184h640v112H0z"/>
      </svg>
      <span>{{ showFullName ? 'English' : 'EN' }}</span>
    </button>
  </div>
</template>
