import React from 'react';
import { Dialog } from './ui/Dialog';
import { Keyboard, Search, Download, Plus, HelpCircle } from 'lucide-react';
import { getModifierSymbol } from '../hooks/useKeyboardShortcuts';

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  {
    category: 'General',
    items: [
      { keys: [getModifierSymbol(), '/'], description: 'Show keyboard shortcuts', icon: HelpCircle },
      { keys: ['Escape'], description: 'Close dialogs and modals' },
    ],
  },
  {
    category: 'Keywords Page',
    items: [
      { keys: [getModifierSymbol(), 'K'], description: 'Add new keyword', icon: Plus },
      { keys: [getModifierSymbol(), 'F'], description: 'Focus search', icon: Search },
      { keys: [getModifierSymbol(), 'E'], description: 'Export to CSV', icon: Download },
    ],
  },
  {
    category: 'Leads Page',
    items: [
      { keys: [getModifierSymbol(), 'F'], description: 'Focus search', icon: Search },
      { keys: [getModifierSymbol(), 'E'], description: 'Export to CSV', icon: Download },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['G', 'then', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'then', 'L'], description: 'Go to Leads' },
      { keys: ['G', 'then', 'A'], description: 'Go to Analytics' },
      { keys: ['G', 'then', 'K'], description: 'Go to Keywords' },
      { keys: ['G', 'then', 'S'], description: 'Go to Settings' },
    ],
  },
];

export function HelpModal({ open, onClose }: HelpModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="space-y-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
                            {key}
                          </kbd>
                          {keyIndex < item.keys.length - 1 && key !== 'then' && (
                            <span className="text-gray-400 text-xs mx-0.5">+</span>
                          )}
                          {key === 'then' && (
                            <span className="text-gray-400 text-xs mx-1">{key}</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <Keyboard className="inline h-3 w-3 mr-1" />
            Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">{getModifierSymbol()}</kbd>
            {' + '}
            <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">/</kbd>
            {' '}anytime to view this help
          </p>
        </div>
      </div>
    </Dialog>
  );
}
