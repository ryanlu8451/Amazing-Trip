import { X } from 'lucide-react'

export default function EditModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-slate-950/55 z-50 flex items-end justify-center px-3"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#f9faf8] rounded-t-[2rem] w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl border-x-[6px] border-t-[6px] border-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-[#f9faf8] rounded-t-[1.6rem]">
          <h3 className="font-bold text-slate-900">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto pb-28">
          {children}
        </div>
      </div>
    </div>
  )
}
