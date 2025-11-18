import React from 'react'
import { CheckCircle, XCircle, Trophy, Trash, X, AlertCircle } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onAction: (action: string) => Promise<void>
  onClear: () => void
  isProcessing?: boolean
}

export default function BulkActions({
  selectedCount,
  onAction,
  onClear,
  isProcessing = false
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  const handleAction = async (action: string) => {
    if (isProcessing) return

    // Confirm destructive actions
    if (action === 'lost' || action === 'ignored') {
      const confirmMessage = action === 'lost'
        ? `Mark ${selectedCount} lead(s) as lost?`
        : `Mark ${selectedCount} lead(s) as ignored?`

      if (!window.confirm(confirmMessage)) {
        return
      }
    }

    await onAction(action)
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-4 animate-slide-up">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedCount}</span>
          <span className="text-gray-500 dark:text-gray-400">selected</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('contacted')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            title="Mark as Contacted"
          >
            <CheckCircle size={16} />
            Contacted
          </button>

          <button
            onClick={() => handleAction('won')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            title="Mark as Won"
          >
            <Trophy size={16} />
            Won
          </button>

          <button
            onClick={() => handleAction('lost')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            title="Mark as Lost"
          >
            <XCircle size={16} />
            Lost
          </button>

          <button
            onClick={() => handleAction('ignored')}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            title="Mark as Ignored"
          >
            <Trash size={16} />
            Ignore
          </button>
        </div>

        {/* Clear selection button */}
        <button
          onClick={onClear}
          disabled={isProcessing}
          className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Clear Selection"
        >
          <X size={20} />
        </button>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}

// Add animation styles to your global CSS or Tailwind config
const animationStyles = `
@keyframes slide-up {
  from {
    transform: translate(-50%, 100%);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}`

// Export animation styles for injection
export { animationStyles }