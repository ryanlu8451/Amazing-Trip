import { useState } from 'react'
import { AlertTriangle, FileText, Plus, Trash2, Pencil } from 'lucide-react'
import { useTripStore } from '../store/tripStore'
import EditModal from '../components/EditModal'
import { InputField } from '../components/InputField'

const TIPS_SECTIONS = [
  { key: 'etiquette', emoji: '🎎', title: 'Local Etiquette', items: ['Keep your phone on silent and speak quietly on trains.','Stand on the correct side of escalators and leave the other side open for walking.','Carry your trash with you, since public trash bins can be limited.'] },
  { key: 'money',     emoji: '💴', title: 'Money', items: ['Some small shops may prefer cash, so keep local currency on hand.','Convenience store ATMs are useful for withdrawing cash while traveling.','Tipping customs vary by destination, so check local expectations before you go.'] },
  { key: 'transport', emoji: '🚇', title: 'Transportation', items: ['Transit cards can make train, bus, and convenience store payments faster.','Google Maps is helpful for routes, transfers, and walking directions.','Confirm last train or bus times before late-night plans.'] },
  { key: 'safety',    emoji: '🔒', title: 'Safety', items: ['Keep passport copies separate from the original document.','Stay aware of your belongings in busy stations, markets, and tourist areas.','For earthquakes or local emergencies, stay calm and follow official instructions.'] },
]

export default function Tips() {
  const { tips, addEmergency, deleteEmergency, addDoc, deleteDoc, updateTips } = useTripStore()

  const [eModal, setEModal] = useState(false)
  const [eForm, setEForm] = useState({ emoji: '📞', label: '', number: '' })

  const [dModal, setDModal] = useState(false)
  const [dForm, setDForm] = useState({ emoji: '📋', label: '', value: '' })

  const [noteEdit, setNoteEdit] = useState(false)
  const [noteVal, setNoteVal] = useState(tips.notes || '')

  const saveEmergency = () => {
    if (!eForm.label || !eForm.number) return alert('Please enter a name and phone number.')
    addEmergency(eForm)
    setEModal(false)
    setEForm({ emoji: '📞', label: '', number: '' })
  }

  const saveDoc = () => {
    if (!dForm.label || !dForm.value) return alert('Please enter a document name and details.')
    addDoc(dForm)
    setDModal(false)
    setDForm({ emoji: '📋', label: '', value: '' })
  }

  const saveNote = () => {
    updateTips({ notes: noteVal })
    setNoteEdit(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-rose-500 to-orange-500 px-6 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <p className="text-rose-200 text-sm">AMAZING TRIP</p>
          <h1 className="text-white text-2xl font-bold mt-1">Travel Tips</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Emergency contacts */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h2 className="font-semibold text-gray-800">Emergency Contacts</h2>
            </div>
            <button onClick={() => setEModal(true)}
              className="flex items-center gap-1 text-rose-500 text-sm">
              <Plus size={15} /> Add
            </button>
          </div>
          {tips.emergency.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">{e.emoji}</span>
                <span className="text-sm text-gray-700">{e.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <a href={`tel:${e.number}`} className="text-blue-600 font-mono text-sm font-semibold">
                  {e.number}
                </a>
                <button onClick={() => deleteEmergency(e.id)}>
                  <Trash2 size={14} className="text-rose-300 hover:text-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Important documents */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-blue-500" />
              <h2 className="font-semibold text-gray-800">Important Documents</h2>
            </div>
            <button onClick={() => setDModal(true)}
              className="flex items-center gap-1 text-blue-500 text-sm">
              <Plus size={15} /> Add
            </button>
          </div>
          {tips.docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span>{d.emoji}</span>
                <span className="text-sm text-gray-500">{d.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-gray-800">{d.value}</span>
                <button onClick={() => deleteDoc(d.id)}>
                  <Trash2 size={14} className="text-rose-300 hover:text-rose-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Travel notes */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">📝 Travel Notes</h2>
            <button onClick={() => { setNoteVal(tips.notes || ''); setNoteEdit(true) }}>
              <Pencil size={15} className="text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {tips.notes || 'Tap the pencil icon to add travel notes.'}
          </p>
        </div>

        {/* Static travel tips */}
        {TIPS_SECTIONS.map((section) => (
          <div key={section.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-semibold text-gray-800">{section.emoji} {section.title}</h2>
            </div>
            <ul className="px-5 py-3 space-y-2">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-600 py-1">
                  <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      {/* Emergency contact modal */}
      {eModal && (
        <EditModal title="Add Emergency Contact" onClose={() => setEModal(false)}>
          <InputField label="Emoji" value={eForm.emoji}
            onChange={v => setEForm(f => ({ ...f, emoji: v }))} placeholder="🚔" />
          <InputField label="Name" value={eForm.label}
            onChange={v => setEForm(f => ({ ...f, label: v }))} placeholder="Local police" />
          <InputField label="Phone Number" value={eForm.number}
            onChange={v => setEForm(f => ({ ...f, number: v }))} placeholder="110" />
          <button onClick={saveEmergency}
            className="w-full bg-rose-500 text-white rounded-xl py-3 font-semibold text-sm mt-2">
            Save
          </button>
        </EditModal>
      )}

      {/* Document modal */}
      {dModal && (
        <EditModal title="Add Important Document" onClose={() => setDModal(false)}>
          <InputField label="Emoji" value={dForm.emoji}
            onChange={v => setDForm(f => ({ ...f, emoji: v }))} placeholder="🛂" />
          <InputField label="Document Name" value={dForm.label}
            onChange={v => setDForm(f => ({ ...f, label: v }))} placeholder="Passport number" />
          <InputField label="Details" value={dForm.value}
            onChange={v => setDForm(f => ({ ...f, value: v }))} placeholder="A12345678" />
          <button onClick={saveDoc}
            className="w-full bg-blue-500 text-white rounded-xl py-3 font-semibold text-sm mt-2">
            Save
          </button>
        </EditModal>
      )}

      {/* Notes modal */}
      {noteEdit && (
        <EditModal title="Edit Travel Notes" onClose={() => setNoteEdit(false)}>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              rows={6}
              placeholder="Write any important travel information..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
          <button onClick={saveNote}
            className="w-full bg-rose-500 text-white rounded-xl py-3 font-semibold text-sm">
            Save
          </button>
        </EditModal>
      )}
    </div>
  )
}
