import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  User,
  Link,
  Mail,
  ShieldCheck,
  Lock,
  Globe,
  Trash2,
  Share2,
  Copy,
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import { useAuthStore } from '../store/authStore'
import { canManageTripMembers, normalizeEmail, saveTripToCloud } from '../lib/tripCloud'
import { useTranslation } from '../lib/i18n'

export default function TripSettings() {
  const navigate = useNavigate()
  const {
    trips,
    activeTripId,
    trip,
    updateTrip,
    cloudError,
  } = useTripStore()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')
  const [message, setMessage] = useState('')

  const activeTrip = trips.find((item) => item.id === activeTripId)
  const userCanManageMembers = canManageTripMembers(activeTrip, user)
  const memberEmails = activeTrip?.memberEmails || []
  const memberRoles = activeTrip?.memberRoles || {}
  const ownerEmail = normalizeEmail(activeTrip?.ownerEmail || user?.email)
  const tripType = activeTrip?.tripType || 'solo'
  const inviteLink = activeTrip?.id
    ? `${window.location.origin}/invite/${activeTrip.id}`
    : window.location.origin

  const selectTripType = (nextTripType) => {
    if (activeTrip && tripType !== nextTripType) {
      updateTrip({
        tripType: nextTripType,
      })
    }
  }

  const copyInviteLink = async () => {
    await navigator.clipboard?.writeText(inviteLink)
    setMessage(t('tripSettings.linkCopied'))
  }

  const openNativeShare = async (invitedEmail) => {
    const tripName = activeTrip?.name || t('common.untitledTrip')
    const shareText = invitedEmail
      ? t('tripSettings.shareText', {
          tripName,
          email: invitedEmail,
        })
      : t('tripSettings.shareTextGeneric', { tripName })

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('tripSettings.shareTitle', { tripName }),
          text: shareText,
          url: inviteLink,
        })
        setMessage(t('tripSettings.sharedWith', { email: invitedEmail }))
        return
      } catch (error) {
        if (error.name === 'AbortError') {
          setMessage(t('tripSettings.shareCancelled'))
          return
        }
      }
    }

    await copyInviteLink()
  }

  const shareTrip = async () => {
    const invitedEmail = normalizeEmail(email)

    if (!activeTrip || !invitedEmail) {
      setMessage(t('tripSettings.enterEmail'))
      return
    }

    if (!userCanManageMembers) {
      setMessage(t('tripSettings.ownerInviteOnly'))
      return
    }

    const nextMemberRoles = {
      ...memberRoles,
      [ownerEmail]: 'owner',
      [invitedEmail]: role,
    }
    const nextMemberEmails = [
      ...new Set([
        ownerEmail,
        normalizeEmail(user?.email),
        ...memberEmails.map(normalizeEmail),
        invitedEmail,
      ].filter(Boolean)),
    ]
    const updatedTrip = {
      ...activeTrip,
      tripType: 'group',
      memberEmails: nextMemberEmails,
      memberRoles: nextMemberRoles,
    }

    updateTrip({
      tripType: 'group',
      memberEmails: nextMemberEmails,
      memberRoles: nextMemberRoles,
    })
    saveTripToCloud(updatedTrip, user).catch(() => {
      setMessage(t('tripSettings.shareSaveWarning'))
    })

    setEmail('')
    setRole('viewer')
    await openNativeShare(invitedEmail)
  }

  const updateMemberRole = (memberEmail, nextRole) => {
    const normalizedMemberEmail = normalizeEmail(memberEmail)

    if (!activeTrip || normalizedMemberEmail === ownerEmail || !userCanManageMembers) {
      return
    }

    updateTrip({
      memberRoles: {
        ...memberRoles,
        [ownerEmail]: 'owner',
        [normalizedMemberEmail]: nextRole,
      },
    })

    setMessage(t('tripSettings.roleUpdated', { email: normalizedMemberEmail }))
  }

  const removeMember = (memberEmail) => {
    const normalizedMemberEmail = normalizeEmail(memberEmail)

    if (!activeTrip || normalizedMemberEmail === ownerEmail || !userCanManageMembers) {
      return
    }

    if (!window.confirm(t('tripSettings.removeConfirm', { email: normalizedMemberEmail }))) {
      return
    }

    const nextRoles = {
      ...memberRoles,
    }

    delete nextRoles[normalizedMemberEmail]

    updateTrip({
      memberEmails: memberEmails.filter(
        (currentEmail) => normalizeEmail(currentEmail) !== normalizedMemberEmail
      ),
      memberRoles: nextRoles,
    })

    setMessage(t('tripSettings.removed', { email: normalizedMemberEmail }))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-700 px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-white/20 text-white rounded-full p-2 mb-5"
          >
            <ArrowLeft size={20} />
          </button>

          <p className="text-blue-100 text-sm font-medium">
            {t('tripSettings.title').toUpperCase()}
          </p>
          <h1 className="text-white text-2xl font-bold mt-1">
            {trip.name || t('common.untitledTrip')}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {t('tripSettings.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1">{t('tripSettings.tripType')}</h2>
          <p className="text-xs text-gray-400 mb-4">
            {t('tripSettings.tripTypeBody')}
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => selectTripType('solo')}
              className={`rounded-2xl border p-4 text-left ${
                tripType === 'solo'
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('tripSettings.solo')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('tripSettings.soloBody')}
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectTripType('group')}
              className={`rounded-2xl border p-4 text-left ${
                tripType === 'group'
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="bg-indigo-100 text-indigo-600 rounded-full p-2">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t('tripSettings.group')}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('tripSettings.groupBody')}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {cloudError && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
            {cloudError}
          </div>
        )}

        {tripType === 'group' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} className="text-green-500" />
                <h2 className="font-semibold text-gray-800">{t('tripSettings.members')}</h2>
              </div>

              <div className="space-y-3">
                {memberEmails.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-500">
                      {t('tripSettings.emptyMembers')}
                    </p>
                  </div>
                ) : (
                  memberEmails.map((memberEmail) => {
                    const normalizedMemberEmail = normalizeEmail(memberEmail)
                    const memberRole = memberRoles[normalizedMemberEmail] || 'viewer'
                    const isOwner = normalizedMemberEmail === ownerEmail || memberRole === 'owner'

                    return (
                      <div
                        key={normalizedMemberEmail}
                        className="rounded-xl bg-gray-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {normalizedMemberEmail}
                            </p>
                            <p className="text-xs text-gray-400 capitalize">
                              {isOwner ? t('tripSettings.ownerBadge') : t(`common.${memberRole}`)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isOwner || !userCanManageMembers ? (
                              <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full capitalize">
                                {t(`common.${memberRole}`)}
                              </span>
                            ) : (
                              <select
                                value={memberRole}
                                onChange={(event) =>
                                  updateMemberRole(normalizedMemberEmail, event.target.value)
                                }
                                className="max-w-[116px] border border-gray-200 rounded-full bg-white px-3 py-1 text-xs text-gray-600 focus:outline-none focus:border-blue-400"
                                aria-label={t('tripSettings.changeRoleFor', {
                                  email: normalizedMemberEmail,
                                })}
                              >
                                <option value="viewer">{t('common.viewer')}</option>
                                <option value="editor">{t('common.editor')}</option>
                              </select>
                            )}
                            {!isOwner && userCanManageMembers && (
                              <button
                                type="button"
                                onClick={() => removeMember(normalizedMemberEmail)}
                                className="p-1 rounded-full hover:bg-red-50"
                                aria-label={`Remove ${normalizedMemberEmail}`}
                              >
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {!userCanManageMembers && (
                  <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    {t('tripSettings.viewOnlyMembers')}
                  </p>
                </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-blue-500" />
                <h2 className="font-semibold text-gray-800">{t('tripSettings.inviteMember')}</h2>
              </div>

              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('tripSettings.email')}
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="friend@gmail.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-4"
                disabled={!userCanManageMembers}
              />

              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t('tripSettings.permission')}
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-4"
                disabled={!userCanManageMembers}
              >
                <option value="viewer">{t('tripSettings.viewerOption')}</option>
                <option value="editor">{t('tripSettings.editorOption')}</option>
              </select>

              {message && (
                <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-600">
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={shareTrip}
                disabled={!userCanManageMembers}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t('tripSettings.sendInvite')}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Link size={18} className="text-purple-500" />
                <h2 className="font-semibold text-gray-800">{t('tripSettings.inviteLink')}</h2>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                {t('tripSettings.inviteLinkBody')}
              </p>

              <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
                <p className="break-all text-xs text-gray-500">{inviteLink}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openNativeShare('')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white"
                >
                  <Share2 size={16} />
                  {t('tripSettings.shareLink')}
                </button>

                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="flex items-center justify-center gap-2 rounded-xl bg-purple-50 py-3 text-sm font-semibold text-purple-600"
                >
                  <Copy size={16} />
                  {t('tripSettings.copyLink')}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            {tripType === 'solo' ? (
              <Lock size={18} className="text-gray-500" />
            ) : (
              <Globe size={18} className="text-indigo-500" />
            )}

            <h2 className="font-semibold text-gray-800">{t('tripSettings.currentMode')}</h2>
          </div>

          <p className="text-sm text-gray-500">
            {tripType === 'solo'
              ? t('tripSettings.soloMode')
              : t('tripSettings.groupMode')}
          </p>
        </div>
      </div>
    </div>
  )
}
