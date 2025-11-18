# Leadscout Features Guide

Welcome to Leadscout! This guide covers all the features available in the application.

## Table of Contents

- [Dark Mode](#dark-mode)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Keywords Management](#keywords-management)
- [Leads Management](#leads-management)
- [Analytics](#analytics)
- [CSV Export](#csv-export)
- [Email Integration](#email-integration)
- [Real-time Notifications](#real-time-notifications)
- [Browser Support](#browser-support)

---

## Dark Mode

### Overview
Leadscout includes a comprehensive dark mode system that adapts to your preferences.

### How to Use
1. **Toggle Theme**: Click the moon/sun icon in the sidebar footer
2. **Automatic Detection**: On first visit, Leadscout detects your system preference
3. **Persistence**: Your choice is saved and remembered across sessions

### Features
- Smooth transitions between light and dark themes
- Complete coverage across all UI components
- Optimized contrast for readability
- System preference detection

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + /` | Show keyboard shortcuts help |

### Keywords Page

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Add new keyword |
| `Cmd/Ctrl + F` | Focus search field |
| `Cmd/Ctrl + E` | Export to CSV |

### Leads Page

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Focus search field |
| `Cmd/Ctrl + E` | Export to CSV |
| `Cmd/Ctrl + A` | Select all leads |

### Analytics Page

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + E` | Export to CSV |

### Platform Support
- **Mac**: Uses `⌘` (Command) key
- **Windows/Linux**: Uses `Ctrl` key

The shortcuts automatically adapt to your platform.

---

## Keywords Management

### Overview
Track and manage keywords for lead discovery across Reddit and LinkedIn.

### Features

#### Add Keyword
1. Click the "Add Keyword" button or press `Cmd/Ctrl + K`
2. Enter the keyword (minimum 2 characters)
3. Select platform: Reddit, LinkedIn, or Both
4. Toggle enabled/disabled status
5. Click "Create Keyword"

#### Edit Keyword
1. Click the edit icon (pencil) next to any keyword
2. Modify keyword details
3. Click "Update Keyword"

#### Delete Keyword
1. Click the delete icon (trash) next to any keyword
2. Confirm deletion in the dialog
3. Keyword is permanently removed

#### Filter Keywords
- **Search**: Type in the search box to filter by keyword text
- **Platform**: Select "All", "Reddit", "LinkedIn", or "Both"
- **Status**: Select "All", "Active", or "Inactive"
- **Clear Filters**: Click "Clear Filters" when filters are active

#### Enable/Disable Keywords
- Toggle the switch next to any keyword to enable/disable it
- Disabled keywords won't be used for lead discovery

### Best Practices
- Use specific keywords for better lead quality
- Monitor performance before adding many keywords
- Disable underperforming keywords instead of deleting them
- Export data regularly for backup

---

## Leads Management

### Overview
View, manage, and track your discovered leads with powerful bulk operations.

### Features

#### View Leads
- See all leads in a comprehensive table
- View lead source, platform, status, and quality score
- Click any row to see detailed information

#### Select Leads
- **Single Selection**: Click checkbox next to any lead
- **Multiple Selection**: Click multiple checkboxes
- **Select All**: Click header checkbox or press `Cmd/Ctrl + A`
- **Visual Feedback**: Selected leads are highlighted in blue

#### Bulk Operations
When leads are selected, a floating action bar appears with these options:

1. **Mark as Contacted** (Blue button)
   - Updates selected leads to "contacted" status
   - Use after initial outreach

2. **Mark as Won** (Green button)
   - Updates selected leads to "won" status
   - Use when lead converts to customer

3. **Mark as Lost** (Red button)
   - Updates selected leads to "lost" status
   - Requires confirmation
   - Use when lead declines or goes cold

4. **Mark as Ignored** (Gray button)
   - Updates selected leads to "ignored" status
   - Requires confirmation
   - Use for irrelevant or spam leads

#### Filter Leads
- **Search**: Filter by lead name or company
- **Platform**: Filter by Reddit or LinkedIn
- **Status**: Filter by lead status
- **Quality Score**: Filter by score range

#### Export Leads
- Click "Export to CSV" or press `Cmd/Ctrl + E`
- Exports all leads matching current filters
- Includes all lead data, notes, and scores
- Opens automatically in Excel with proper formatting

### Tips
- Use bulk operations to save time on repetitive tasks
- Filter before bulk operations to target specific groups
- Export data before making major changes
- Review quality scores to prioritize outreach

---

## Analytics

### Overview
Track your lead generation performance with detailed analytics.

### Available Metrics
- Lead volume over time
- Conversion rates by platform
- Quality score distributions
- Keyword performance
- Platform comparison

### Features
- **Interactive Charts**: Hover for detailed data points
- **Export Data**: Export analytics to CSV with `Cmd/Ctrl + E`
- **Time Periods**: View data by day, week, month, or custom range
- **Dark Mode**: All charts adapt to your theme preference

---

## CSV Export

### Overview
Export your data to CSV format for analysis, backup, or reporting.

### Export Features
- **UTF-8 BOM**: Ensures proper character encoding in Excel
- **Auto-naming**: Files include date/time stamp
- **Filter Respect**: Only exports data matching active filters
- **Proper Formatting**: All columns properly formatted and labeled

### Available Exports

#### Keywords Export
**Filename**: `leadscout-keywords-YYYY-MM-DD.csv`

**Columns**:
- Keyword
- Platform
- Status
- Created Date
- Last Modified

#### Leads Export
**Filename**: `leadscout-leads-YYYY-MM-DD.csv`

**Columns**:
- Name
- Company
- Platform
- Source
- Status
- Quality Score
- Contact Info
- Notes
- Discovery Date

#### Analytics Export
**Filename**: `leadscout-analytics-YYYY-MM-DD.csv`

**Columns**:
- Date
- Metric
- Value
- Platform
- Keyword

### How to Export
1. Navigate to the page you want to export
2. Apply any filters (optional)
3. Click "Export to CSV" button or press `Cmd/Ctrl + E`
4. File downloads automatically
5. Open in Excel, Google Sheets, or any spreadsheet application

---

## Email Integration

### Overview
Send emails to leads directly from Leadscout with professional templates.

### Features

#### Email Composer
- **Template selection**: Choose from pre-built templates
- **Live preview**: See how email will look before sending
- **Custom fields**: Support for template variables
- **Lead context**: Shows lead score and info while composing

#### Available Templates

1. **Initial Outreach**
   - Professional introduction
   - Reference to lead's post
   - Clear value proposition
   - Call-to-action button

2. **Follow-up**
   - Friendly reminder
   - Time-based personalization
   - Alternative contact methods

3. **Proposal**
   - Project timeline
   - Budget details
   - Deliverables list
   - Next steps

#### Email Tracking
- All emails logged in database
- Track sent, delivered, opened, and clicked status
- View email history for each lead
- Webhook support for delivery tracking

### Configuration
Email integration supports multiple providers:
- SMTP (Gmail, Outlook, etc.)
- SendGrid
- Resend

See `.env.example` for configuration details.

---

## Real-time Notifications

### Overview
Get instant notifications when new high-quality leads are discovered.

### Notification Types

#### Toast Notifications
- Appears in top-right corner
- Different styles based on lead quality score
- Click to view lead details
- Auto-dismiss after 10 seconds

#### Browser Push Notifications
- Desktop notifications for high-priority leads (score ≥ 8)
- Requires user permission
- Click to navigate directly to lead
- Persistent for urgent leads

#### Sound Alerts
- Plays for leads scoring ≥ 8
- Can be toggled on/off in Settings
- Uses Web Audio API

### Settings
Configure notification preferences in the Settings page:
- **Enable/Disable Browser Notifications**
- **Toggle Sound Alerts**
- **Set Notification Thresholds** (future)

### WebSocket Connection
- Real-time bidirectional communication
- Auto-reconnection on connection drops
- Health monitoring with periodic pings
- Graceful fallback to polling if needed

---

## Browser Support

### Minimum Requirements
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

### Feature Support
- **Dark Mode**: All modern browsers with CSS custom properties
- **Keyboard Shortcuts**: All major browsers
- **CSV Export**: All browsers with download support
- **localStorage**: IE 8+ (for theme persistence)
- **WebSocket**: All modern browsers
- **Push Notifications**: Chrome 50+, Firefox 44+, Safari 16+

### Recommended
For the best experience, use the latest version of Chrome, Firefox, Safari, or Edge.

---

## Troubleshooting

### Dark Mode Issues
**Problem**: Theme doesn't persist across sessions
- **Solution**: Check browser localStorage is enabled
- **Solution**: Check for browser extensions blocking storage

**Problem**: Theme flickers on page load
- **Solution**: This is normal and improves after first load

### Keyboard Shortcuts Not Working
**Problem**: Shortcuts don't respond
- **Solution**: Ensure no input field has focus
- **Solution**: Check for browser extension conflicts
- **Solution**: Try clicking outside any dialog/modal first

### CSV Export Issues
**Problem**: Special characters appear incorrectly in Excel
- **Solution**: File includes UTF-8 BOM - ensure you're opening with Excel 2016+
- **Solution**: Try importing as UTF-8 in Google Sheets

**Problem**: Download doesn't start
- **Solution**: Check browser download permissions
- **Solution**: Check for popup blockers

### Bulk Operations Issues
**Problem**: Bulk action doesn't complete
- **Solution**: Check network connection
- **Solution**: Try smaller batches of leads
- **Solution**: Refresh page and try again

**Problem**: Can't select leads
- **Solution**: Ensure leads are loaded (not in loading state)
- **Solution**: Check if filters are excluding all leads

### Email Issues
**Problem**: Emails not sending
- **Solution**: Check SMTP credentials in environment configuration
- **Solution**: Verify firewall isn't blocking SMTP ports

**Problem**: Template errors
- **Solution**: Verify all template variables are provided
- **Solution**: Check email_logs table for error details

### WebSocket/Notification Issues
**Problem**: No real-time updates
- **Solution**: Verify WebSocket server is running
- **Solution**: Check CORS configuration
- **Solution**: Ensure browser allows WebSocket connections

**Problem**: Browser notifications not appearing
- **Solution**: Grant notification permissions in browser settings
- **Solution**: Enable notifications in Leadscout Settings page
- **Solution**: Check system notification settings (OS level)

---

## Tips & Best Practices

### Keywords
- Start with 5-10 targeted keywords
- Monitor performance for 1 week before scaling
- Disable low-quality keywords rather than deleting
- Use both platforms for maximum coverage

### Leads
- Review new leads daily
- Update status promptly after contact
- Use quality scores to prioritize outreach
- Export data weekly for backup

### Workflow
1. Set up keywords with clear targeting
2. Enable real-time notifications for instant alerts
3. Review new leads as they arrive
4. Use email templates for quick outreach
5. Update lead status with bulk operations
6. Export analytics weekly to track progress
7. Adjust keywords based on performance

### Performance
- Clear filters when not needed
- Export data in smaller batches if experiencing slowness
- Use keyboard shortcuts to speed up workflow
- Enable only necessary keywords
- Keep WebSocket connection stable for real-time updates

### Email Best Practices
- Customize templates for each lead
- Reference specific details from their post
- Keep initial emails short and focused
- Use follow-ups strategically
- Track open rates to optimize send times

---

## Getting Help

### Quick Reference
- Press `Cmd/Ctrl + /` anytime to see keyboard shortcuts
- Hover over buttons for tooltips
- Check this guide for detailed feature explanations

### Support
For issues or questions, contact your system administrator or refer to the project repository.

---

**Last Updated**: 2025-01-18
**Version**: See [CHANGELOG.md](CHANGELOG.md) for version history
