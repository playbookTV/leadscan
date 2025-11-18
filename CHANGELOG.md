# Changelog

All notable changes to the Leadscout project will be documented in this file.

## [Unreleased] - 2025-01-18

### Added

#### 🌗 Dark Mode System
- **Theme Context** - Full dark mode support with system preference detection
- **Theme Toggle** - Moon/Sun icon toggle in sidebar
- **localStorage Persistence** - Remembers user's theme preference
- **Smooth Transitions** - 0.2s ease transitions between themes
- **Complete Coverage** - All UI components support dark mode

#### ⌨️ Keyboard Shortcuts
- **Global Shortcuts System** - Platform-aware (Mac ⌘ / Windows Ctrl)
- **Help Modal** - Comprehensive shortcuts reference (Cmd/Ctrl + /)
- **Keywords Page Shortcuts**:
  - `Cmd/Ctrl + K` - Add new keyword
  - `Cmd/Ctrl + F` - Focus search
  - `Cmd/Ctrl + E` - Export to CSV
- **Leads Page Shortcuts**:
  - `Cmd/Ctrl + F` - Focus search
  - `Cmd/Ctrl + E` - Export to CSV
  - `Cmd/Ctrl + A` - Select all leads
- **Analytics Page Shortcuts**:
  - `Cmd/Ctrl + E` - Export to CSV

#### 🎨 Improved Empty States
- **Reusable Component** - Icon-based visual feedback
- **Contextual Messaging** - Different messages for filters vs. no data
- **Actionable CTAs** - Primary and secondary action buttons
- **Implemented On**:
  - Keywords page (with clear filters action)
  - Leads page (with clear filters action)

#### 📤 CSV Export
- **Keywords Export** - Full data export with filtering support
- **Leads Export** - Complete lead data including notes and scores
- **Analytics Export** - Already existed, enhanced with dark mode
- **Features**:
  - UTF-8 BOM for Excel compatibility
  - Auto-generated filenames with dates
  - Respects active filters
  - Proper data formatting

#### 🔄 Bulk Operations (Leads Page)
- **Multi-Select** - Checkbox selection for leads
- **Select All** - Header checkbox or Cmd/Ctrl + A
- **Visual Feedback** - Blue highlight for selected rows
- **Floating Action Bar** - Appears when leads selected
- **Bulk Actions**:
  - Mark as Contacted
  - Mark as Won
  - Mark as Lost
  - Mark as Ignored
- **Features**:
  - Confirmation for destructive actions
  - Loading states
  - Toast notifications
  - Auto-refresh after completion

#### 🆕 New Components
1. `contexts/ThemeContext.tsx` - Theme state management
2. `components/ThemeToggle.tsx` - Theme toggle button
3. `components/ui/EmptyState.tsx` - Reusable empty state
4. `components/ui/Dialog.tsx` - Modal component
5. `components/KeywordForm.tsx` - Keyword creation/editing
6. `hooks/useKeyboardShortcuts.ts` - Keyboard shortcut system
7. `components/HelpModal.tsx` - Shortcuts reference modal

### Enhanced

#### UI Components
- **Card** - Added dark mode support
- **Badge** - Dark mode for all 5 variants (default, success, warning, danger, info)
- **Button** - Dark mode for all 4 variants (primary, secondary, danger, ghost)
- **BulkActions** - Added dark mode support

#### Pages
- **Keywords** - Full CRUD operations, filters, export, shortcuts
- **Leads** - Bulk operations, export, shortcuts, improved UX
- **Analytics** - Keyboard shortcuts, help modal, dark mode
- **All Pages** - Dark mode text and component styling

### Fixed
- **useRealtime.ts → useRealtime.tsx** - Fixed JSX usage in TypeScript file
- **EmailComposer.tsx** - Fixed API import statement (default export)
- **API Types** - Added bulk operation endpoint

### Technical Details

#### Build
- **Status**: ✅ All builds successful
- **Bundle Size**: 1.23 MB (353 KB gzipped)
- **Modules**: 4409 transformed
- **Build Time**: ~20-25 seconds

#### Dependencies
- No new dependencies added
- Leveraged existing libraries (React Query, Sonner, Lucide React)

#### Browser Support
- Dark mode: Modern browsers with CSS custom properties
- Keyboard shortcuts: All major browsers
- localStorage: IE 8+

### Migration Guide

#### For Developers
1. **Theme Usage**: Wrap your app with `ThemeProvider` (already done in App.tsx)
2. **Dark Mode Classes**: Use Tailwind's `dark:` variant for custom components
3. **Keyboard Shortcuts**: Import and use `useKeyboardShortcuts` hook
4. **Empty States**: Use `<EmptyState>` component instead of custom markup

#### Breaking Changes
- None - All changes are backwards compatible

### Performance
- **Theme Toggle**: Instant with CSS transitions
- **Bulk Operations**: Optimized with React Query invalidation
- **Keyboard Shortcuts**: Minimal overhead with cleanup
- **Dark Mode**: No performance impact (CSS-only)

### Accessibility
- **Keyboard Navigation**: Full keyboard support throughout
- **ARIA Labels**: Added to icon-only buttons
- **Focus Indicators**: Maintained for all interactive elements
- **Screen Readers**: Compatible with assistive technologies

---

## Future Enhancements

### Planned
- Settings page configuration editing
- Global navigation shortcuts (G+D, G+L, etc.)
- Lead assignment to team members
- Saved filter presets
- Code splitting for bundle optimization

### Under Consideration
- Mobile optimizations
- PWA features
- Advanced analytics drilldowns
- Email template management
- CRM integrations
