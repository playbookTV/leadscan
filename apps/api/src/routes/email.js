import express from 'express';
import emailService from '../services/email-service.js';
import db from '../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/email/send - Send email to lead
router.post('/send', async (req, res, next) => {
  try {
    const { leadId, to, subject, template, data } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        error: 'Missing required fields: to and subject are required'
      });
    }

    // Generate HTML from template
    const html = emailService.generateTemplate(template, data);

    // Send email
    const result = await emailService.sendEmail({
      to,
      subject,
      html,
      leadId
    });

    // Update lead status if leadId provided
    if (leadId) {
      const { error: updateError } = await db.from('leads').update({
        status: 'contacted',
        contacted_at: new Date().toISOString(),
        contacted_method: 'email'
      }).eq('id', leadId);

      if (updateError) {
        logger.error('Failed to update lead status:', updateError);
      }
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      ...result
    });
  } catch (error) {
    logger.error('Email send error:', error);
    next(error);
  }
});

// POST /api/email/send-bulk - Send emails to multiple leads
router.post('/send-bulk', async (req, res, next) => {
  try {
    const { leadIds, template, subject } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        error: 'leadIds array is required'
      });
    }

    // Fetch leads
    const { data: leads, error: fetchError } = await db
      .from('leads')
      .select('*')
      .in('id', leadIds);

    if (fetchError) throw fetchError;

    const results = [];
    const errors = [];

    for (const lead of leads) {
      try {
        const html = emailService.generateTemplate(template, {
          leadName: lead.author_name,
          postText: lead.post_text,
          projectType: lead.project_type,
          budget: lead.budget_amount
        });

        const result = await emailService.sendEmail({
          to: lead.author_email || lead.contact_info,
          subject: subject || `Re: ${lead.project_type || 'Your project'}`,
          html,
          leadId: lead.id
        });

        results.push({ leadId: lead.id, success: true, ...result });
      } catch (error) {
        errors.push({ leadId: lead.id, error: error.message });
      }
    }

    res.json({
      success: true,
      sent: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    logger.error('Bulk email send error:', error);
    next(error);
  }
});

// GET /api/email/templates - Get available templates
router.get('/templates', (req, res) => {
  res.json([
    {
      id: 'initial-outreach',
      name: 'Initial Outreach',
      description: 'First contact email to introduce yourself and your services',
      variables: ['leadName', 'postText', 'projectType', 'budget']
    },
    {
      id: 'follow-up',
      name: 'Follow Up',
      description: 'Follow up email after no response',
      variables: ['leadName', 'daysSince']
    },
    {
      id: 'proposal',
      name: 'Project Proposal',
      description: 'Send a detailed project proposal',
      variables: ['leadName', 'projectType', 'timeline', 'budget', 'deliverables']
    }
  ]);
});

// GET /api/email/preview/:template - Preview email template
router.post('/preview/:template', (req, res) => {
  try {
    const { template } = req.params;
    const { data } = req.body;

    const html = emailService.generateTemplate(template, data || {
      leadName: 'John Doe',
      postText: 'I need a website for my startup...',
      projectType: 'website development',
      budget: '5000',
      daysSince: 3,
      timeline: '2-3 weeks',
      deliverables: ['Website design', 'Development', 'Testing', 'Deployment']
    });

    res.send(html);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/email/logs/:leadId - Get email history for lead
router.get('/logs/:leadId', async (req, res, next) => {
  try {
    const { data, error } = await db
      .from('email_logs')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    logger.error('Failed to fetch email logs:', error);
    next(error);
  }
});

// GET /api/email/logs - Get all email logs
router.get('/logs', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = db
      .from('email_logs')
      .select('*, leads(author_name, project_type, platform)')
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    logger.error('Failed to fetch email logs:', error);
    next(error);
  }
});

// POST /api/email/webhook - Handle email webhook events (SendGrid, etc)
router.post('/webhook', async (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      const { email, event: eventType, sg_message_id, timestamp } = event;

      // Map webhook events to our status
      const statusMap = {
        'delivered': 'delivered',
        'open': 'opened',
        'click': 'clicked',
        'bounce': 'bounced',
        'dropped': 'failed',
        'spamreport': 'failed'
      };

      const status = statusMap[eventType];
      if (!status) continue;

      // Update email log
      const updateData = { status };

      if (eventType === 'delivered') {
        updateData.delivered_at = new Date(timestamp * 1000).toISOString();
      } else if (eventType === 'open') {
        updateData.opened_at = new Date(timestamp * 1000).toISOString();
      } else if (eventType === 'click') {
        updateData.clicked_at = new Date(timestamp * 1000).toISOString();
      }

      await db
        .from('email_logs')
        .update(updateData)
        .eq('message_id', sg_message_id);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Email webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;