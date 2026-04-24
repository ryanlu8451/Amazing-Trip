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
} from 'lucide-react'
import { useTripStore } from '../store/tripStore'

export default function TripSettings() {
  const navigate = useNavigate()
  const { trip } = useTripStore()

  const [tripType, setTripType] = useState('solo')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')

  const comingSoon = () => {
    alert('Sharing feature will be connected to Firebase later.')
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

          <p className="text-blue-100 text-sm font-medium">TRIP SETTINGS</p>
          <h1 className="text-white text-2xl font-bold mt-1">
            {trip.name || 'Untitled Trip'}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Manage trip type, members, sharing, and permissions.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1">Trip Type</h2>
          <p className="text-xs text-gray-400 mb-4">
            Choose whether this trip is only for you or shared with others.
          </p>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setTripType('solo')}
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
                  <h3 className="font-semibold text-gray-800">Solo Trip</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Only you manage this trip. Good for personal planning.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTripType('group')}
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
                  <h3 className="font-semibold text-gray-800">Group Trip</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Invite friends or family and control who can edit.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {tripType === 'group' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={18} className="text-green-500" />
                <h2 className="font-semibold text-gray-800">Trip Members</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Ryan</p>
                    <p className="text-xs text-gray-400">Owner</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                    Owner
                  </span>
                </div>

                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Invited members will appear here later.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Mail size={18} className="text-blue-500" />
                <h2 className="font-semibold text-gray-800">Invite Member</h2>
              </div>

              <label className="block text-xs font-medium text-gray-500 mb-1">
                Email
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="friend@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-4"
              />

              <label className="block text-xs font-medium text-gray-500 mb-1">
                Permission
              </label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 mb-4"
              >
                <option value="viewer">Viewer - can only view</option>
                <option value="editor">Editor - can edit trip details</option>
              </select>

              <button
                type="button"
                onClick={comingSoon}
                className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm"
              >
                Send Invite
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Link size={18} className="text-purple-500" />
                <h2 className="font-semibold text-gray-800">Invite Link</h2>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Generate a private invite link for this trip later.
              </p>

              <button
                type="button"
                onClick={comingSoon}
                className="w-full bg-purple-50 text-purple-600 rounded-xl py-3 font-semibold text-sm"
              >
                Generate Invite Link
              </button>
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

            <h2 className="font-semibold text-gray-800">Current Mode</h2>
          </div>

          <p className="text-sm text-gray-500">
            {tripType === 'solo'
              ? 'This trip is currently designed as a private solo trip.'
              : 'This trip is prepared for group sharing and permission control.'}
          </p>
        </div>
      </div>
    </div>
  )
}