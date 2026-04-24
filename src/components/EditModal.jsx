import { X } from 'lucide-react'

export default function EditModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0 bg-white rounded-t-3xl">
          <h3 className="font-semibold text-gray-800">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto pb-28">
          {children}
        </div>
      </div>
    </div>
  )
}