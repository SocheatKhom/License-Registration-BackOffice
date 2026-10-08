<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { licensesApi } from '@/api/licenses.api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  ArrowLeft,
  Award,
  Building,
  UserCheck,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle2,
  ExternalLink,
  QrCode,
  FileText,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

const licenseId = route.params.id
const license = ref(null)
const loading = ref(false)
const error = ref(null)
const successMessage = ref('')

// Revocation modal state
const revokeModalOpen = ref(false)
const revoking = ref(false)

async function fetchLicenseDetails() {
  loading.value = true
  error.value = null

  try {
    const response = await licensesApi.getById(licenseId)
    license.value = response?.data || null
  } catch (err) {
    console.error('Failed to load license details:', err)
    error.value = err.message || 'Unable to retrieve license details.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLicenseDetails()
})

function goBack() {
  router.push('/licenses')
}

async function handleRevokeConfirm(reason) {
  revoking.value = true
  try {
    await licensesApi.revoke(licenseId, { reason })
    revokeModalOpen.value = false
    successMessage.value = 'License revoked successfully.'
    setTimeout(() => { successMessage.value = '' }, 4000)
    await fetchLicenseDetails()
  } catch (err) {
    error.value = err.message || 'Failed to revoke license.'
  } finally {
    revoking.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between">
      <button
        type="button"
        @click="goBack"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        <span>{{ t('common.back') }}</span>
      </button>

      <div v-if="license" class="flex items-center gap-2">
        <StatusBadge :status="license.status" />

        <button
          v-if="license.status === 'ACTIVE' && authStore.isAdmin"
          type="button"
          @click="revokeModalOpen = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-700 hover:text-white text-red-700 border border-red-300 rounded text-xs font-semibold transition-colors"
        >
          <Ban class="w-3.5 h-3.5" />
          <span>{{ t('license.revoke') || 'Revoke License' }}</span>
        </button>
      </div>
    </div>

    <!-- Success Message Banner -->
    <div
      v-if="successMessage"
      class="p-3.5 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-900 flex items-center gap-2"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-700 shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Alert -->
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchLicenseDetails" />

    <!-- Loading State -->
    <LoadingSpinner v-if="loading && !license" />

    <!-- Main License Detail Layout -->
    <div v-else-if="license" class="space-y-6">
      <!-- Official License Certificate Card -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-6 sm:p-8">
        <!-- Ministry Certificate Header -->
        <div class="text-center border-b border-slate-200 pb-6 mb-6">
          <p class="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {{ t('app.kingdom') }}
          </p>
          <p class="text-[11px] text-slate-500 font-medium mt-0.5">
            {{ t('app.motto') }}
          </p>
          <div class="w-12 h-0.5 bg-amber-500 mx-auto my-3"></div>
          <img
            src="/ministry-logo.png"
            alt="Ministry of Information Official Logo"
            class="w-16 h-16 mx-auto mb-2 object-contain"
          />
          <h2 class="text-sm font-bold text-slate-800">
            {{ t('app.ministry') }}
          </h2>
          <h1 class="text-base sm:text-lg font-bold text-blue-900 mt-1">
            MEDIA OUTLET OPERATING LICENSE
          </h1>
          <p class="text-xs text-slate-600">
            អាជ្ញាបណ្ណប្រកបអាជីវកម្មសារព័ត៌មានផ្លូវការ
          </p>
        </div>

        <!-- License Information Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase">License Number</div>
            <div class="text-sm font-mono font-bold text-blue-900 mt-0.5">{{ license.license_number }}</div>
          </div>

          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase">Issued Date</div>
            <div class="text-xs font-semibold text-slate-800 mt-0.5">{{ formatDate(license.issued_at, locale) }}</div>
          </div>

          <div>
            <div class="text-[10px] text-slate-400 font-bold uppercase">Expiration Date</div>
            <div :class="['text-xs font-bold mt-0.5', license.status === 'ACTIVE' && new Date(license.expires_at) < new Date() ? 'text-red-700' : 'text-slate-800']">
              {{ formatDate(license.expires_at, locale) }}
            </div>
          </div>
        </div>

        <!-- 2 Information Blocks: Media Outlet & Licensee -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <!-- Media Outlet Block -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              <Building class="w-4 h-4 text-blue-900" />
              <span>Licensed Media Entity</span>
            </div>
            <dl class="space-y-2 text-xs">
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Entity Name</dt>
                <dd class="font-bold text-slate-900">{{ license.application?.mediaOutlet?.name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Media Type</dt>
                <dd class="font-mono text-slate-800">{{ license.application?.mediaOutlet?.media_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Registered Address</dt>
                <dd class="text-slate-700">{{ license.application?.mediaOutlet?.address || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Linked Application</dt>
                <dd>
                  <router-link
                    v-if="license.application?.id"
                    :to="`/applications/${license.application.id}`"
                    class="font-mono text-blue-900 hover:underline"
                  >
                    {{ license.application?.application_number }}
                  </router-link>
                  <span v-else>—</span>
                </dd>
              </div>
            </dl>
          </div>

          <!-- Licensee Block -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              <UserCheck class="w-4 h-4 text-amber-700" />
              <span>Authorized Licensee</span>
            </div>
            <dl class="space-y-2 text-xs">
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Full Name</dt>
                <dd class="font-bold text-slate-900">{{ license.application?.licensee?.full_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">National ID</dt>
                <dd class="font-mono text-slate-800">{{ license.application?.licensee?.national_id || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Position</dt>
                <dd class="text-slate-700">{{ license.application?.licensee?.position || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Nationality</dt>
                <dd class="text-slate-700">{{ license.application?.licensee?.nationality || 'Cambodian' }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Verification Token & Public Link -->
        <div class="mt-6 p-4 bg-blue-50/60 border border-blue-200 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-2 text-slate-800">
            <QrCode class="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <div class="font-bold text-slate-900">Digital Verification Token</div>
              <div class="font-mono text-[11px] text-slate-600">{{ license.verification_token }}</div>
            </div>
          </div>

          <a
            :href="`http://localhost:5000/api/v1/public/licenses/verify/${license.verification_token}`"
            target="_blank"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold transition-colors shrink-0"
          >
            <span>Verify Public Token</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>

    <!-- Revoke Confirmation Modal -->
    <ConfirmModal
      :is-open="revokeModalOpen"
      :danger="true"
      title="Revoke Media License"
      :message="`Are you sure you want to revoke official license ${license?.license_number}? This action immediately terminates operating authorization and cannot be undone.`"
      confirm-text="Revoke License"
      :require-reason="true"
      reason-placeholder="Enter regulatory violation reason or explanation for revocation..."
      :loading="revoking"
      @confirm="handleRevokeConfirm"
      @cancel="revokeModalOpen = false"
    />
  </div>
</template>
