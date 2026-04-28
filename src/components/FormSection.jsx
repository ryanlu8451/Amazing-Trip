import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function FormSection({
  title,
  description = '',
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  tone = 'blue',
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = open ?? internalOpen
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100',
  }
  const toneClass = tones[tone] || tones.blue
  const toggleOpen = () => {
    const nextOpen = !isOpen

    if (onOpenChange) {
      onOpenChange(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  return (
    <section className={`mb-4 rounded-2xl border ${toneClass}`}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-semibold">{title}</h4>
          {description && (
            <p className="mt-0.5 text-xs opacity-80">{description}</p>
          )}
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-white/70 bg-white px-4 py-4">
          {children}
        </div>
      )}
    </section>
  )
}
