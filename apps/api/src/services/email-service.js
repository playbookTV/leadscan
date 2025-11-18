import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import logger from '../utils/logger.js';
import db from '../config/database.js';

class EmailService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'smtp';
    this.initializeProvider();
  }

  initializeProvider() {
    if (this.provider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else if (this.provider === 'sendgrid') {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.sgMail = sgMail;
    } else if (this.provider === 'resend') {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    logger.info(`Email service initialized with ${this.provider} provider`);
  }

  async sendEmail({ to, subject, html, leadId }) {
    try {
      let info;
      const from = process.env.EMAIL_FROM || 'noreply@ovalay.com';

      if (this.provider === 'smtp') {
        info = await this.transporter.sendMail({
          from,
          to,
          subject,
          html
        });
      } else if (this.provider === 'sendgrid') {
        const msg = {
          to,
          from,
          subject,
          html
        };
        [info] = await this.sgMail.send(msg);
      } else if (this.provider === 'resend') {
        info = await this.resend.emails.send({
          from,
          to,
          subject,
          html
        });
      }

      // Log to database
      await this.logEmail(leadId, to, subject, 'sent', info?.messageId || info?.id);

      logger.info(`Email sent to ${to}`, { leadId, messageId: info?.messageId || info?.id });
      return { success: true, messageId: info?.messageId || info?.id };
    } catch (error) {
      await this.logEmail(leadId, to, subject, 'failed', null, error.message);
      logger.error('Email send failed:', error);
      throw error;
    }
  }

  async logEmail(leadId, to, subject, status, messageId, error = null) {
    try {
      const { data, error: dbError } = await db.from('email_logs').insert({
        lead_id: leadId,
        to_email: to,
        subject,
        status,
        message_id: messageId,
        error_message: error,
        sent_at: new Date().toISOString(),
        template_name: null,
        template_data: null
      }).select();

      if (dbError) {
        logger.error('Failed to log email:', dbError);
      }

      return data;
    } catch (logError) {
      logger.error('Error logging email:', logError);
    }
  }

  generateTemplate(templateName, data) {
    const templates = {
      'initial-outreach': this.initialOutreachTemplate(data),
      'follow-up': this.followUpTemplate(data),
      'proposal': this.proposalTemplate(data)
    };
    return templates[templateName] || templates['initial-outreach'];
  }

  initialOutreachTemplate({ leadName, postText, projectType, budget }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .quote { border-left: 4px solid #3B82F6; padding-left: 16px; margin: 20px 0; color: #666; background: #fff; padding: 16px; border-radius: 4px; }
          .cta { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          ul { margin: 10px 0; }
          li { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ovalay Studios</h1>
            <p style="margin: 0; font-size: 14px;">Web Design & Development</p>
          </div>
          <div class="content">
            <p>Hi ${leadName || 'there'},</p>

            <p>I came across your post about needing ${projectType || 'web development'}${budget ? ` with a budget of $${budget}` : ''}, and I'd love to help!</p>

            <div class="quote">
              "${postText || 'Your project sounds interesting'}"
            </div>

            <p>At Ovalay Studios, we specialize in creating high-quality ${projectType || 'web solutions'} that convert. We've worked with startups and established companies to bring their vision to life.</p>

            <p><strong>What we can offer:</strong></p>
            <ul>
              <li>Modern, responsive design that works on all devices</li>
              <li>Fast turnaround time - we can start this week</li>
              <li>Transparent pricing with no hidden fees</li>
              <li>Ongoing support after launch</li>
            </ul>

            <p>Would you be available for a quick 15-minute call this week to discuss your project in more detail?</p>

            <center>
              <a href="https://calendly.com/ovalay/15min" class="cta">Schedule a Call</a>
            </center>

            <p>Looking forward to hearing from you!</p>

            <p>Best regards,<br>
            Leslie<br>
            Founder, Ovalay Studios<br>
            <a href="https://ovalay.com">ovalay.com</a></p>
          </div>
          <div class="footer">
            <p>Ovalay Studios | Web Design & Development</p>
            <p><a href="https://ovalay.com" style="color: #3B82F6;">ovalay.com</a> | <a href="mailto:hello@ovalay.com" style="color: #3B82F6;">hello@ovalay.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  followUpTemplate({ leadName, daysSince }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .cta { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ovalay Studios</h1>
          </div>
          <div class="content">
            <p>Hi ${leadName || 'there'},</p>

            <p>I wanted to follow up on my previous message from ${daysSince || 'a few'} days ago about your project.</p>

            <p>I understand you're probably busy, but I wanted to make sure my email didn't get lost in your inbox.</p>

            <p>If you're still looking for help with your project, I'd be happy to discuss how we can work together. We have availability to start this week and can work within your budget.</p>

            <p>Even if you're not ready to move forward right now, I'd appreciate any feedback about your requirements so we can better understand how to help.</p>

            <center>
              <a href="https://calendly.com/ovalay/15min" class="cta">Book a Quick Chat</a>
            </center>

            <p>Best regards,<br>
            Leslie<br>
            Founder, Ovalay Studios</p>
          </div>
          <div class="footer">
            <p>Ovalay Studios | Web Design & Development</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  proposalTemplate({ leadName, projectType, timeline, budget, deliverables = [] }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .section { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #e0e0e0; }
          .cta { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          h2 { color: #3B82F6; margin-top: 0; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Project Proposal</h1>
            <p style="margin: 0; font-size: 14px;">Ovalay Studios</p>
          </div>
          <div class="content">
            <p>Hi ${leadName || 'there'},</p>

            <p>Thank you for taking the time to discuss your project! Based on our conversation, here's our proposal for your ${projectType || 'project'}:</p>

            <div class="section">
              <h2>Project Timeline</h2>
              <p>${timeline || 'We can deliver your project within 2-3 weeks from the start date.'}</p>
            </div>

            <div class="section">
              <h2>Investment</h2>
              <p><strong>${budget ? `$${budget}` : 'To be discussed based on final requirements'}</strong></p>
              <p>This includes all design, development, and initial support.</p>
            </div>

            <div class="section">
              <h2>Deliverables</h2>
              <ul>
                ${deliverables.length > 0
                  ? deliverables.map(d => `<li>${d}</li>`).join('')
                  : `
                    <li>Responsive website design</li>
                    <li>Mobile-optimized experience</li>
                    <li>SEO optimization</li>
                    <li>Performance optimization</li>
                    <li>30-day post-launch support</li>
                  `
                }
              </ul>
            </div>

            <div class="section">
              <h2>Next Steps</h2>
              <ol>
                <li>Review this proposal</li>
                <li>Sign the agreement</li>
                <li>50% deposit to begin work</li>
                <li>We start building your project!</li>
              </ol>
            </div>

            <p>Ready to get started? Simply reply to this email and we'll kick off your project!</p>

            <center>
              <a href="mailto:hello@ovalay.com?subject=Let's Start the Project" class="cta">Accept Proposal</a>
            </center>

            <p>Best regards,<br>
            Leslie<br>
            Founder, Ovalay Studios<br>
            <a href="https://ovalay.com">ovalay.com</a></p>
          </div>
          <div class="footer">
            <p>This proposal is valid for 14 days</p>
            <p>Ovalay Studios | Web Design & Development</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();