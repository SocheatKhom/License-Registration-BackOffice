<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { applicationsApi } from '@/api/applications.api'
import { documentsApi } from '@/api/documents.api'
import { licensesApi } from '@/api/licenses.api'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/constants/roles'
import { formatDate, formatDateTime, formatFileSize } from '@/utils/formatters'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import {
  ArrowLeft,
  FileText,
  Building,
  UserCheck,
  FileCheck,
  History,
  Calendar,
  Hash,
  Download,
  Eye,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  Award,
  Clock,
  Send,
  X,
  FileIcon,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const authStore = useAuthStore()

const applicationId = route.params.id
const application = ref(null)
const documents = ref([])
const linkedLicense = ref(null)
const loading = ref(false)
const error = ref(null)

// Review workflow states
const selectedAction = ref('APPROVE')
const reviewNotes = ref('')
const notesError = ref('')
const submitting = ref(false)
const reviewSuccessMessage = ref('')
const confirmModalOpen = ref(false)

// Document Preview Modal states
const previewModalOpen = ref(false)
const previewLoading = ref(false)
const previewDoc = ref(null)
const previewUrl = ref(null)
const previewMime = ref(null)
const downloadingId = ref(null)

// Reviewer capability check (ADMIN & SUPER_ADMIN only per docs/09-review-approval.md)
const canReview = computed(() => {
  return [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(authStore.userRole)
})

// Reviewable status check: SUBMITTED or UNDER_REVIEW per backend review service
const isReviewable = computed(() => {
  return application.value && ['SUBMITTED', 'UNDER_REVIEW'].includes(application.value.status)
})

async function fetchApplicationDetails() {
  loading.value = true
  error.value = null

  try {
    const [appRes, docsRes] = await Promise.all([
      applicationsApi.getById(applicationId),
      documentsApi.getByApplication(applicationId).catch(() => ({ data: [] })),
    ])

    application.value = appRes?.data || null
    documents.value = Array.isArray(docsRes?.data) ? docsRes.data : []

    // If approved, check if there is an associated license
    if (application.value?.status === 'APPROVED') {
      try {
        const licRes = await licensesApi.list({ limit: 50 })
        const allLicenses = Array.isArray(licRes?.data) ? licRes.data : (licRes?.data?.licenses || [])
        linkedLicense.value = allLicenses.find(l => l.application_id === applicationId) || null
      } catch (licErr) {
        console.warn('Could not fetch linked license:', licErr)
      }
    }
  } catch (err) {
    console.error('Failed to load application detail:', err)
    error.value = err.message || 'Unable to retrieve application details.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchApplicationDetails()
})

onUnmounted(() => {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
  }
})

function goBack() {
  router.push('/applications')
}

function selectReviewAction(action) {
  selectedAction.value = action
  notesError.value = ''
  if (action === 'APPROVE' && !reviewNotes.value) {
    reviewNotes.value = 'All legal documents and criteria verified according to Ministry regulations.'
  }
}

function handleOpenConfirmModal() {
  notesError.value = ''
  const trimmed = reviewNotes.value.trim()
  if (!trimmed || trimmed.length < 3) {
    notesError.value = t('review.validationNotesRequired')
    return
  }
  confirmModalOpen.value = true
}

async function executeReview() {
  if (submitting.value) return // Prevent duplicate execution per docs/09 section 7

  submitting.value = true
  confirmModalOpen.value = false
  reviewSuccessMessage.value = ''
  error.value = null

  try {
    const payload = {
      action: selectedAction.value,
      notes: reviewNotes.value.trim(),
    }

    const response = await applicationsApi.review(applicationId, payload)

    if (selectedAction.value === 'APPROVE') {
      reviewSuccessMessage.value = t('review.successApprove')
      if (response?.data?.license) {
        linkedLicense.value = response.data.license
      }
    } else if (selectedAction.value === 'REJECT') {
      reviewSuccessMessage.value = t('review.successReject')
    } else if (selectedAction.value === 'REQUEST_INFORMATION') {
      reviewSuccessMessage.value = t('review.successRequestInfo')
    }

    // Refresh application state and status timeline
    await fetchApplicationDetails()
  } catch (err) {
    console.error('Review submission failed:', err)
    error.value = err.response?.data?.message || err.message || 'Review submission failed.'
  } finally {
    submitting.value = false
  }
}

// Document Management Actions
async function handleDownloadDocument(doc) {
  if (downloadingId.value) return
  downloadingId.value = doc.id
  try {
    await documentsApi.downloadDocument(doc.id, doc.original_name)
  } catch (err) {
    console.error('Download failed:', err)
  } finally {
    downloadingId.value = null
  }
}

async function handlePreviewDocument(doc) {
  previewDoc.value = doc
  previewModalOpen.value = true
  previewLoading.value = true
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }

  try {
    const res = await documentsApi.previewDocument(doc.id)
    previewUrl.value = res.url
    previewMime.value = res.mimeType
  } catch (err) {
    console.error('Failed to stream preview:', err)
  } finally {
    previewLoading.value = false
  }
}

function closePreviewModal() {
  previewModalOpen.value = false
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

function getDocumentTypeLabel(type) {
  return t(`documentTypes.${type}`) || type
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

      <div v-if="application" class="flex items-center gap-2">
        <StatusBadge :status="application.status" />
      </div>
    </div>

    <!-- Error Alert -->
    <ErrorAlert v-if="error" :message="error" :show-retry="true" @retry="fetchApplicationDetails" />

    <!-- Success Message Banner -->
    <div
      v-if="reviewSuccessMessage"
      class="bg-emerald-50 border border-emerald-300 p-4 rounded-md flex items-center justify-between text-xs text-emerald-900"
    >
      <div class="flex items-center gap-2">
        <CheckCircle class="w-5 h-5 text-emerald-700 shrink-0" />
        <span class="font-bold">{{ reviewSuccessMessage }}</span>
      </div>
      <button
        type="button"
        @click="reviewSuccessMessage = ''"
        class="text-emerald-700 hover:text-emerald-900 font-bold"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <!-- Loading State -->
    <LoadingSpinner v-if="loading && !application" />

    <!-- Details View Container -->
    <div v-else-if="application" class="space-y-6">
      <!-- Application Header Banner -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-mono text-blue-900">
                {{ application.application_number }}
              </h1>
              <StatusBadge :status="application.status" />
            </div>
            <p class="text-xs text-slate-500 mt-1">
              {{ application.mediaOutlet?.name }} • {{ application.mediaOutlet?.media_type }}
            </p>
          </div>

          <div class="text-xs text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-md space-y-1">
            <div>
              <strong>{{ t('application.submittedDate') }}:</strong>
              {{ formatDate(application.submitted_at, locale) }}
            </div>
            <div>
              <strong>{{ t('common.dateCreated') || 'Created' }}:</strong>
              {{ formatDate(application.created_at, locale) }}
            </div>
          </div>
        </div>

        <!-- 3-Column Info Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <!-- 1. Media Outlet Information -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              <Building class="w-4 h-4 text-blue-900" />
              <span>{{ t('application.mediaOutlet') }}</span>
            </div>
            <dl class="space-y-2 text-xs">
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Name</dt>
                <dd class="font-bold text-slate-900">{{ application.mediaOutlet?.name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Type</dt>
                <dd class="font-medium text-slate-800 font-mono">{{ application.mediaOutlet?.media_type || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Address</dt>
                <dd class="text-slate-700">{{ application.mediaOutlet?.address || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Contact Phone & Email</dt>
                <dd class="text-slate-700">{{ application.mediaOutlet?.phone || '—' }} | {{ application.mediaOutlet?.email || '—' }}</dd>
              </div>
            </dl>
          </div>

          <!-- 2. Licensee / Authorized Person -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              <UserCheck class="w-4 h-4 text-amber-700" />
              <span>{{ t('application.applicant') }} (Licensee)</span>
            </div>
            <dl class="space-y-2 text-xs">
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Full Name</dt>
                <dd class="font-bold text-slate-900">{{ application.licensee?.full_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">National ID</dt>
                <dd class="font-mono font-medium text-slate-800">{{ application.licensee?.national_id || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Nationality</dt>
                <dd class="text-slate-700">{{ application.licensee?.nationality || 'Cambodian' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Position</dt>
                <dd class="text-slate-700">{{ application.licensee?.position || '—' }}</dd>
              </div>
            </dl>
          </div>

          <!-- 3. Submitting Officer / Account -->
          <div class="p-4 bg-slate-50 border border-slate-200 rounded-md">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-900 border-b border-slate-200 pb-2 mb-3">
              <FileCheck class="w-4 h-4 text-emerald-700" />
              <span>Registered User Account</span>
            </div>
            <dl class="space-y-2 text-xs">
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">User Name</dt>
                <dd class="font-bold text-slate-900">{{ application.user?.name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">Email</dt>
                <dd class="font-mono text-slate-700">{{ application.user?.email || '—' }}</dd>
              </div>
              <div>
                <dt class="text-slate-400 text-[10px] uppercase font-semibold">System Role</dt>
                <dd class="font-medium text-blue-900">{{ application.user?.role || '—' }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- OFFICIAL REVIEW ACTION PANEL (ADMIN & SUPER_ADMIN) -->
      <div v-if="canReview" class="flat-card bg-white border border-slate-300 rounded-md p-6">
        <!-- Review Panel Header -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-blue-900" />
            <div>
              <h2 class="text-sm font-bold text-slate-900">
                {{ t('review.panelTitle') }}
              </h2>
              <p class="text-[11px] text-slate-500">
                {{ t('review.panelSubtitle') }}
              </p>
            </div>
          </div>

          <span
            v-if="isReviewable"
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded text-[11px] font-bold"
          >
            <Clock class="w-3.5 h-3.5" />
            <span>Ready for Decision</span>
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-bold"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            <span>Review Concluded</span>
          </span>
        </div>

        <!-- If application is reviewable: show interactive action bar -->
        <div v-if="isReviewable" class="space-y-4">
          <!-- Step 1: Select Action -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">
              Select Decision Action:
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Approve Button -->
              <button
                type="button"
                @click="selectReviewAction('APPROVE')"
                :class="[
                  'p-3 text-left border rounded transition-colors flex items-start gap-2.5',
                  selectedAction === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                ]"
              >
                <CheckCircle :class="['w-4 h-4 mt-0.5', selectedAction === 'APPROVE' ? 'text-emerald-700' : 'text-slate-400']" />
                <div>
                  <div class="text-xs">{{ t('review.approve') }}</div>
                  <div class="text-[10px] text-slate-500 font-normal mt-0.5">Issues official media license</div>
                </div>
              </button>

              <!-- Request Information Button -->
              <button
                type="button"
                @click="selectReviewAction('REQUEST_INFORMATION')"
                :class="[
                  'p-3 text-left border rounded transition-colors flex items-start gap-2.5',
                  selectedAction === 'REQUEST_INFORMATION'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-600'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                ]"
              >
                <HelpCircle :class="['w-4 h-4 mt-0.5', selectedAction === 'REQUEST_INFORMATION' ? 'text-amber-700' : 'text-slate-400']" />
                <div>
                  <div class="text-xs">{{ t('review.requestInfo') }}</div>
                  <div class="text-[10px] text-slate-500 font-normal mt-0.5">Ask for revisions / documents</div>
                </div>
              </button>

              <!-- Reject Button -->
              <button
                type="button"
                @click="selectReviewAction('REJECT')"
                :class="[
                  'p-3 text-left border rounded transition-colors flex items-start gap-2.5',
                  selectedAction === 'REJECT'
                    ? 'border-red-600 bg-red-50/70 text-red-950 font-bold ring-1 ring-red-600'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                ]"
              >
                <XCircle :class="['w-4 h-4 mt-0.5', selectedAction === 'REJECT' ? 'text-red-700' : 'text-slate-400']" />
                <div>
                  <div class="text-xs">{{ t('review.reject') }}</div>
                  <div class="text-[10px] text-slate-500 font-normal mt-0.5">Formal non-compliance refusal</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Step 2: Enter Notes -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">
              {{ t('review.notes') }}
              <span class="text-red-600">*</span>
            </label>
            <textarea
              v-model="reviewNotes"
              rows="3"
              class="w-full text-xs border border-slate-300 rounded p-2.5 focus:border-blue-900 focus:outline-none"
              :placeholder="
                selectedAction === 'APPROVE'
                  ? t('review.notesPlaceholderApprove')
                  : selectedAction === 'REJECT'
                    ? t('review.notesPlaceholderReject')
                    : t('review.notesPlaceholderRequestInfo')
              "
            ></textarea>
            <div class="flex items-center justify-between text-[11px] mt-1">
              <span v-if="notesError" class="text-red-600 font-semibold">{{ notesError }}</span>
              <span v-else class="text-slate-400">Minimum 3 characters required.</span>
              <span class="text-slate-400 font-mono">{{ reviewNotes.length }} chars</span>
            </div>
          </div>

          <!-- Step 3: Action Trigger -->
          <div class="flex items-center justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              @click="handleOpenConfirmModal"
              :disabled="submitting"
              :class="[
                'inline-flex items-center gap-1.5 px-5 py-2 rounded text-xs font-bold text-white transition-colors disabled:opacity-60',
                selectedAction === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' : (
                  selectedAction === 'REJECT' ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-600 hover:bg-amber-700'
                )
              ]"
            >
              <Send class="w-3.5 h-3.5" />
              <span>
                {{
                  selectedAction === 'APPROVE'
                    ? t('review.approve')
                    : (selectedAction === 'REJECT' ? t('review.reject') : t('review.requestInfo'))
                }}
              </span>
            </button>
          </div>
        </div>

        <!-- If application is not in reviewable status -->
        <div v-else class="bg-slate-50 border border-slate-200 p-4 rounded-md space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs text-slate-700 font-medium">
              {{ t('review.alreadyProcessedNotice') }}
            </p>

            <!-- If approved and has linked license, provide direct link -->
            <router-link
              v-if="linkedLicense"
              :to="`/licenses/${linkedLicense.id}`"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold"
            >
              <Award class="w-3.5 h-3.5" />
              <span>{{ t('review.viewIssuedLicense') }} ({{ linkedLicense.license_number }})</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Attached Documents Panel (Phase 7: Documents Management) -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-6">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <FileText class="w-4 h-4 text-blue-900" />
            <span class="text-sm font-bold text-slate-900">{{ t('application.documents') }}</span>
          </div>
          <span class="text-xs text-slate-500 font-mono">
            {{ documents.length }} Attached File(s)
          </span>
        </div>

        <div v-if="documents.length === 0" class="py-6 text-center text-xs text-slate-500">
          {{ t('application.noDocuments') }}
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="p-4 bg-slate-50 border border-slate-200 rounded-md flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
          >
            <!-- File Info Header -->
            <div class="space-y-1.5">
              <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200 bg-blue-50 text-blue-900">
                {{ getDocumentTypeLabel(doc.document_type || doc.type) }}
              </span>
              <div class="font-bold text-xs text-slate-900 truncate" :title="doc.original_name">
                {{ doc.original_name }}
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{{ formatFileSize(doc.file_size) }}</span>
                <span>•</span>
                <span>{{ formatDate(doc.uploaded_at || doc.createdAt, locale) }}</span>
              </div>
            </div>

            <!-- Action Buttons: Preview & Download -->
            <div class="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                @click="handlePreviewDocument(doc)"
                class="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded transition-colors"
              >
                <Eye class="w-3.5 h-3.5 text-blue-900" />
                <span>{{ t('common.view') }}</span>
              </button>

              <button
                type="button"
                @click="handleDownloadDocument(doc)"
                :disabled="downloadingId === doc.id"
                class="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded transition-colors disabled:opacity-50"
              >
                <Download class="w-3.5 h-3.5 text-slate-600" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Official Review History Panel (docs/07-application-management.md section 3) -->
      <div v-if="application.reviews && application.reviews.length > 0" class="flat-card bg-white border border-slate-300 rounded-md p-6">
        <div class="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
          <ShieldCheck class="w-4 h-4 text-emerald-700" />
          <span>{{ t('review.historyTitle') }}</span>
        </div>

        <div class="space-y-3">
          <div
            v-for="rev in application.reviews"
            :key="rev.id"
            class="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider font-mono',
                    rev.action === 'APPROVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : (
                      rev.action === 'REJECT' ? 'bg-red-50 text-red-800 border-red-300' : 'bg-amber-50 text-amber-800 border-amber-300'
                    )
                  ]"
                >
                  {{ rev.action }}
                </span>
                <span class="font-bold text-slate-900">{{ rev.reviewer?.name || 'Reviewer' }}</span>
                <span class="text-[10px] text-slate-400 font-mono">({{ rev.reviewer?.role || 'OFFICER' }})</span>
              </div>
              <time class="text-[11px] font-mono text-slate-500">
                {{ formatDateTime(rev.createdAt || rev.created_at, locale) }}
              </time>
            </div>

            <p class="text-slate-800 bg-white p-3 rounded border border-slate-200 font-medium italic">
              "{{ rev.notes }}"
            </p>
          </div>
        </div>
      </div>

      <!-- Status History Timeline Panel -->
      <div class="flat-card bg-white border border-slate-300 rounded-md p-6">
        <div class="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
          <History class="w-4 h-4 text-purple-700" />
          <span>{{ t('application.statusHistory') }}</span>
        </div>

        <div v-if="!application.statusHistories || application.statusHistories.length === 0" class="py-6 text-center text-xs text-slate-500">
          No status history recorded.
        </div>

        <ol v-else class="relative border-l border-slate-300 ml-3 space-y-6 py-2">
          <li
            v-for="hist in application.statusHistories"
            :key="hist.id"
            class="ml-6"
          >
            <span class="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-white border-2 border-blue-900 rounded-full">
              <span class="w-2 h-2 bg-blue-900 rounded-full"></span>
            </span>

            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div class="flex items-center gap-2">
                <span v-if="hist.from_status" class="text-xs font-mono text-slate-400">
                  {{ hist.from_status }} →
                </span>
                <StatusBadge :status="hist.to_status" />
              </div>
              <time class="text-[11px] font-mono text-slate-500">
                {{ formatDateTime(hist.createdAt || hist.created_at, locale) }}
              </time>
            </div>

            <p v-if="hist.reason" class="mt-1 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
              {{ hist.reason }}
            </p>

            <div v-if="hist.changedByUser" class="mt-1 text-[11px] text-slate-500">
              By: <strong>{{ hist.changedByUser.name }}</strong> ({{ hist.changedByUser.role }})
            </div>
          </li>
        </ol>
      </div>
    </div>

    <!-- Review Confirmation Modal -->
    <div
      v-if="confirmModalOpen"
      class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-md w-full p-6 space-y-4">
        <div class="flex items-start justify-between border-b border-slate-200 pb-3">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-5 h-5 text-blue-900" />
            <h3 class="text-sm font-bold text-slate-900">
              {{
                selectedAction === 'APPROVE'
                  ? t('review.approveConfirmTitle')
                  : selectedAction === 'REJECT'
                    ? t('review.rejectConfirmTitle')
                    : t('review.requestInfoConfirmTitle')
              }}
            </h3>
          </div>
          <button type="button" @click="confirmModalOpen = false" class="text-slate-400 hover:text-slate-700">
            <X class="w-4 h-4" />
          </button>
        </div>

        <p class="text-xs text-slate-600 leading-relaxed">
          {{
            selectedAction === 'APPROVE'
              ? t('review.approveConfirmMessage')
              : selectedAction === 'REJECT'
                ? t('review.rejectConfirmMessage')
                : t('review.requestInfoConfirmMessage')
          }}
        </p>

        <!-- Preview of entered notes -->
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
          <span class="text-slate-400 uppercase text-[10px] font-bold block mb-1">Recorded Reason / Notes:</span>
          <p class="text-slate-800 font-medium italic">"{{ reviewNotes }}"</p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            @click="confirmModalOpen = false"
            :disabled="submitting"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
          >
            {{ t('common.cancel') }}
          </button>

          <button
            type="button"
            @click="executeReview"
            :disabled="submitting"
            :class="[
              'inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded transition-colors disabled:opacity-60',
              selectedAction === 'APPROVE' ? 'bg-emerald-700 hover:bg-emerald-800' : (
                selectedAction === 'REJECT' ? 'bg-red-700 hover:bg-red-800' : 'bg-amber-600 hover:bg-amber-700'
              )
            ]"
          >
            <LoadingSpinner v-if="submitting" class="w-3.5 h-3.5 mr-1" />
            <span>{{ submitting ? t('review.submitting') : t('common.confirm') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- In-App Document Preview Modal (Phase 7: Document Management) -->
    <div
      v-if="previewModalOpen"
      class="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-4 transition-opacity"
      role="dialog"
      aria-modal="true"
    >
      <div class="flat-card bg-white border border-slate-300 rounded-md max-w-4xl w-full p-6 space-y-4 max-h-[92vh] flex flex-col">
        <!-- Preview Modal Header -->
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
          <div class="flex items-center gap-2">
            <FileText class="w-5 h-5 text-blue-900" />
            <div>
              <h3 class="text-sm font-bold text-slate-900">
                {{ previewDoc?.original_name }}
              </h3>
              <p class="text-[11px] text-slate-500 font-mono">
                {{ getDocumentTypeLabel(previewDoc?.document_type) }} • {{ formatFileSize(previewDoc?.file_size) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleDownloadDocument(previewDoc)"
              class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded transition-colors"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              type="button"
              @click="closePreviewModal"
              class="text-slate-400 hover:text-slate-700 p-1"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Preview Viewport -->
        <div class="flex-1 overflow-auto bg-slate-100 rounded border border-slate-200 p-2 min-h-[420px] flex items-center justify-center">
          <LoadingSpinner v-if="previewLoading" />

          <iframe
            v-else-if="previewUrl && previewMime && previewMime.includes('pdf')"
            :src="previewUrl"
            class="w-full h-full min-h-[500px] rounded border-0"
            title="Document PDF Preview"
          ></iframe>

          <img
            v-else-if="previewUrl && previewMime && previewMime.startsWith('image/')"
            :src="previewUrl"
            :alt="previewDoc?.original_name"
            class="max-w-full max-h-[520px] object-contain mx-auto rounded"
          />

          <div v-else class="text-center p-6 text-xs text-slate-500 space-y-2">
            <p>Preview format not supported directly in iframe.</p>
            <button
              type="button"
              @click="handleDownloadDocument(previewDoc)"
              class="px-4 py-2 bg-blue-900 text-white rounded text-xs font-semibold"
            >
              Download File to View
            </button>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0 text-[11px] text-slate-500">
          <span>Protected government document preview streamed securely with JWT authorization.</span>
          <button
            type="button"
            @click="closePreviewModal"
            class="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded"
          >
            {{ t('common.close') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
