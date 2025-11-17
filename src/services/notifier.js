import config from '../config/env.js';
import logger from '../utils/logger.js';
import { sendMessage, editMessage, createLeadActionKeyboard, registerCallbackHandler } from '../config/telegram.js';
import { getDatabase } from '../config/database.js';

// Store scheduled reminders
const scheduledReminders = new Map();

/**
 * Send a lead alert to Telegram
 * @param {Object} lead - The lead object with scoring data
 */
async function sendLeadAlert(lead) {
  try {
    // Format the lead message
    const message = formatLeadMessage(lead);

    // Create inline keyboard with action buttons
    const keyboard = createLeadActionKeyboard(
      lead.id,
      lead.post_url,
      lead.author_profile_url
    );

    // Send the notification
    const result = await sendMessage(message, {
      reply_markup: keyboard,
      disable_notification: false // Alert for high-value leads
    });

    // Update database with notification info
    const db = getDatabase();
    await db.from('leads').update({
      notification_sent: true,
      notification_sent_at: new Date().toISOString(),
      notification_message_id: result.message_id
    }).eq('id', lead.id);

    logger.info('Lead alert sent successfully', {
      leadId: lead.id,
      messageId: result.message_id,
      score: lead.final_score
    });

    return result;
  } catch (error) {
    logger.error('Failed to send lead alert', {
      error: error.message,
      leadId: lead.id
    });
    throw error;
  }
}

/**
 * Format lead data into a Telegram message
 * @param {Object} lead - The lead object
 */
function formatLeadMessage(lead) {
  const lines = [];

  // Header with score and platform
  const scoreEmoji = getScoreEmoji(lead.final_score);
  const platformEmoji = lead.platform === 'twitter' ? '🐦' : '💼';
  lines.push(`${scoreEmoji} *New Lead - Score: ${lead.final_score}/10* ${platformEmoji}`);
  lines.push('');

  // Author info
  lines.push(`👤 *Author:* [${escapeMarkdown(lead.author_name)}](${lead.author_profile_url})`);
  if (lead.author_username) {
    lines.push(`📝 *Username:* @${escapeMarkdown(lead.author_username)}`);
  }
  if (lead.author_followers > 0) {
    lines.push(`👥 *Followers:* ${formatNumber(lead.author_followers)}`);
  }
  lines.push('');

  // Post content (truncated)
  const postText = truncateText(lead.post_text, 500);
  lines.push('📄 *Post Content:*');
  lines.push(`\`\`\`\n${postText}\n\`\`\``);
  lines.push('');

  // AI Analysis (if available)
  if (lead.ai_analysis) {
    lines.push('🤖 *AI Analysis:*');
    if (lead.ai_analysis.summary) {
      lines.push(`📌 ${escapeMarkdown(lead.ai_analysis.summary)}`);
    }
    if (lead.ai_analysis.projectType) {
      lines.push(`💼 *Project Type:* ${lead.ai_analysis.projectType}`);
    }
    if (lead.ai_analysis.estimatedBudget) {
      lines.push(`💰 *Budget:* ${lead.ai_analysis.estimatedBudget}`);
    }
    if (lead.ai_analysis.timeline) {
      lines.push(`⏱ *Timeline:* ${lead.ai_analysis.timeline}`);
    }
    if (lead.ai_analysis.technologies?.length > 0) {
      lines.push(`🔧 *Technologies:* ${lead.ai_analysis.technologies.join(', ')}`);
    }
    if (lead.ai_analysis.redFlags?.length > 0) {
      lines.push(`⚠️ *Red Flags:* ${lead.ai_analysis.redFlags.join(', ')}`);
    }
    lines.push('');
  }

  // Quick Score Breakdown
  if (lead.quick_score_breakdown) {
    const breakdown = lead.quick_score_breakdown;
    const highlights = [];
    if (breakdown.budgetMentioned) highlights.push('💵 Budget mentioned');
    if (breakdown.urgencyDetected) highlights.push('🚨 Urgent');
    if (breakdown.timelineMentioned) highlights.push('📅 Timeline specified');
    if (breakdown.contactMethodProvided) highlights.push('📧 Contact provided');
    if (breakdown.projectTypeClarity) highlights.push('✅ Clear requirements');

    if (highlights.length > 0) {
      lines.push('*Highlights:*');
      lines.push(highlights.join(' | '));
      lines.push('');
    }
  }

  // Metadata
  lines.push(`⏰ *Posted:* ${formatTimeAgo(lead.posted_at)}`);
  lines.push(`🔍 *Keyword:* ${lead.keyword || 'N/A'}`);

  return lines.join('\n');
}

/**
 * Setup callback handlers for Telegram buttons
 */
function setupCallbackHandlers() {
  // Handler for "Contacted" button
  registerCallbackHandler('contacted', async (query, leadId) => {
    try {
      const db = getDatabase();

      // Update lead status
      await db.from('leads').update({
        status: 'contacted',
        contacted_at: new Date().toISOString()
      }).eq('id', leadId);

      // Update message to show status
      await editMessage(
        query.message.message_id,
        query.message.text + '\n\n✅ *Status: CONTACTED*',
        { reply_markup: { inline_keyboard: [] } } // Remove buttons
      );

      // Send confirmation
      await query.answer('Lead marked as contacted! 🎉');

      logger.info('Lead marked as contacted', { leadId });
    } catch (error) {
      logger.error('Failed to mark lead as contacted', {
        error: error.message,
        leadId
      });
      await query.answer('Failed to update status', true);
    }
  });

  // Handler for "Remind" button
  registerCallbackHandler('remind', async (query, leadId, delayMinutes) => {
    try {
      const delay = parseInt(delayMinutes, 10) || 60;

      // Schedule reminder
      const reminderId = setTimeout(async () => {
        await sendReminder(leadId);
        scheduledReminders.delete(leadId);
      }, delay * 60 * 1000);

      scheduledReminders.set(leadId, reminderId);

      // Update database
      const db = getDatabase();
      await db.from('leads').update({
        reminder_scheduled_at: new Date().toISOString(),
        reminder_time: new Date(Date.now() + delay * 60 * 1000).toISOString()
      }).eq('id', leadId);

      await query.answer(`Reminder set for ${delay} minutes! ⏰`);

      logger.info('Reminder scheduled', { leadId, delayMinutes: delay });
    } catch (error) {
      logger.error('Failed to schedule reminder', {
        error: error.message,
        leadId
      });
      await query.answer('Failed to schedule reminder', true);
    }
  });

  // Handler for "Review Later" button
  registerCallbackHandler('review', async (query, leadId) => {
    try {
      const db = getDatabase();

      await db.from('leads').update({
        status: 'reviewed'
      }).eq('id', leadId);

      await query.answer('Lead marked for review 👀');

      logger.info('Lead marked for review', { leadId });
    } catch (error) {
      logger.error('Failed to mark lead for review', {
        error: error.message,
        leadId
      });
      await query.answer('Failed to update status', true);
    }
  });

  // Handler for "Skip" button
  registerCallbackHandler('skip', async (query, leadId) => {
    try {
      const db = getDatabase();

      await db.from('leads').update({
        status: 'ignored'
      }).eq('id', leadId);

      // Update message to show it was skipped
      await editMessage(
        query.message.message_id,
        '~' + query.message.text + '~' + '\n\n❌ *Status: SKIPPED*',
        { reply_markup: { inline_keyboard: [] } }
      );

      await query.answer('Lead skipped ❌');

      logger.info('Lead skipped', { leadId });
    } catch (error) {
      logger.error('Failed to skip lead', {
        error: error.message,
        leadId
      });
      await query.answer('Failed to update status', true);
    }
  });

  logger.info('Telegram callback handlers registered');
}

/**
 * Send a reminder for a lead
 * @param {string} leadId - The lead ID
 */
async function sendReminder(leadId) {
  try {
    const db = getDatabase();

    // Get lead data
    const { data: lead } = await db
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) {
      logger.error('Lead not found for reminder', { leadId });
      return;
    }

    // Send reminder message
    const message = `⏰ *REMINDER*\n\nTime to follow up on this lead!\n\n` +
      `Score: ${lead.final_score}/10\n` +
      `Platform: ${lead.platform}\n` +
      `Author: [${lead.author_name}](${lead.author_profile_url})\n\n` +
      `[View Original Post](${lead.post_url})`;

    await sendMessage(message);

    // Update lead status
    await db.from('leads').update({
      reminder_sent_at: new Date().toISOString()
    }).eq('id', leadId);

    logger.info('Reminder sent', { leadId });
  } catch (error) {
    logger.error('Failed to send reminder', {
      error: error.message,
      leadId
    });
  }
}

/**
 * Helper function to get score emoji
 */
function getScoreEmoji(score) {
  if (score >= 9) return '🔥';
  if (score >= 7) return '🟢';
  if (score >= 5) return '🟡';
  return '🔴';
}

/**
 * Helper function to escape markdown characters
 */
function escapeMarkdown(text) {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

/**
 * Helper function to truncate text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Helper function to format numbers
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return new Date(date).toLocaleDateString();
}

export {
  sendLeadAlert,
  setupCallbackHandlers,
  sendReminder,
  formatLeadMessage
};

export default {
  sendLeadAlert,
  setupCallbackHandlers
};