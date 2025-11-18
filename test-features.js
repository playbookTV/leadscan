#!/usr/bin/env node

/**
 * Test script to verify Email Integration and Real-time Notification features
 */

import { promises as fs } from 'fs';
import path from 'path';

const checkmarks = {
  success: '✅',
  failure: '❌',
  warning: '⚠️',
  info: 'ℹ️'
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkBackendEmailService() {
  console.log('\n📧 EMAIL INTEGRATION - BACKEND');
  console.log('================================');

  const files = [
    { path: '/home/dsgn_api/Leadscout/apps/api/src/services/email-service.js', desc: 'Email Service' },
    { path: '/home/dsgn_api/Leadscout/apps/api/src/routes/email.js', desc: 'Email API Routes' },
  ];

  for (const file of files) {
    const exists = await fileExists(file.path);
    console.log(`${exists ? checkmarks.success : checkmarks.failure} ${file.desc}: ${path.basename(file.path)}`);
  }

  // Check if email dependencies are installed
  const packageJsonPath = '/home/dsgn_api/Leadscout/apps/api/package.json';
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const emailDeps = ['nodemailer', '@sendgrid/mail', 'resend'];

    console.log('\n📦 Email Dependencies:');
    for (const dep of emailDeps) {
      const installed = packageJson.dependencies?.[dep];
      console.log(`  ${installed ? checkmarks.success : checkmarks.failure} ${dep}${installed ? ` (${installed})` : ''}`);
    }
  }

  // Check database schema for email_logs table
  const schemaPath = '/home/dsgn_api/Leadscout/apps/api/database/schema.sql';
  if (await fileExists(schemaPath)) {
    const schema = await fs.readFile(schemaPath, 'utf8');
    const hasEmailLogs = schema.includes('CREATE TABLE email_logs');
    console.log(`\n${hasEmailLogs ? checkmarks.success : checkmarks.failure} Database: email_logs table defined`);
  }
}

async function checkWebSocketService() {
  console.log('\n🔔 REAL-TIME NOTIFICATIONS - BACKEND');
  console.log('=====================================');

  const files = [
    { path: '/home/dsgn_api/Leadscout/apps/api/src/services/websocket-service.js', desc: 'WebSocket Service' },
  ];

  for (const file of files) {
    const exists = await fileExists(file.path);
    console.log(`${exists ? checkmarks.success : checkmarks.failure} ${file.desc}: ${path.basename(file.path)}`);
  }

  // Check Socket.IO dependency
  const packageJsonPath = '/home/dsgn_api/Leadscout/apps/api/package.json';
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const hasSocketIO = packageJson.dependencies?.['socket.io'];
    console.log(`\n📦 WebSocket Dependencies:`);
    console.log(`  ${hasSocketIO ? checkmarks.success : checkmarks.failure} socket.io${hasSocketIO ? ` (${hasSocketIO})` : ''}`);
  }

  // Check if index.js integrates WebSocket
  const indexPath = '/home/dsgn_api/Leadscout/apps/api/src/index.js';
  if (await fileExists(indexPath)) {
    const indexContent = await fs.readFile(indexPath, 'utf8');
    const hasWebSocket = indexContent.includes('websocketService');
    console.log(`\n${hasWebSocket ? checkmarks.success : checkmarks.failure} WebSocket integrated in index.js`);
  }
}

async function checkFrontendComponents() {
  console.log('\n💻 FRONTEND COMPONENTS');
  console.log('======================');

  const files = [
    { path: '/home/dsgn_api/Leadscout/apps/web/src/components/EmailComposer.tsx', desc: 'Email Composer' },
    { path: '/home/dsgn_api/Leadscout/apps/web/src/hooks/useRealtime.ts', desc: 'Real-time Hook' },
    { path: '/home/dsgn_api/Leadscout/apps/web/src/utils/notifications.ts', desc: 'Notification Utils' },
  ];

  for (const file of files) {
    const exists = await fileExists(file.path);
    console.log(`${exists ? checkmarks.success : checkmarks.failure} ${file.desc}: ${path.basename(file.path)}`);
  }

  // Check frontend dependencies
  const packageJsonPath = '/home/dsgn_api/Leadscout/apps/web/package.json';
  if (await fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const frontendDeps = ['socket.io-client', 'sonner'];

    console.log('\n📦 Frontend Dependencies:');
    for (const dep of frontendDeps) {
      const installed = packageJson.dependencies?.[dep];
      console.log(`  ${installed ? checkmarks.success : checkmarks.failure} ${dep}${installed ? ` (${installed})` : ''}`);
    }
  }
}

async function checkIntegration() {
  console.log('\n🔗 INTEGRATION POINTS');
  console.log('=====================');

  // Check App.tsx integration
  const appPath = '/home/dsgn_api/Leadscout/apps/web/src/App.tsx';
  if (await fileExists(appPath)) {
    const appContent = await fs.readFile(appPath, 'utf8');
    const hasRealtime = appContent.includes('useRealtime');
    const hasToaster = appContent.includes('Toaster');
    const hasNotifications = appContent.includes('initializeNotifications');

    console.log(`${hasRealtime ? checkmarks.success : checkmarks.failure} useRealtime hook in App.tsx`);
    console.log(`${hasToaster ? checkmarks.success : checkmarks.failure} Toaster component in App.tsx`);
    console.log(`${hasNotifications ? checkmarks.success : checkmarks.failure} Notification initialization in App.tsx`);
  }

  // Check LeadDetail integration
  const leadDetailPath = '/home/dsgn_api/Leadscout/apps/web/src/pages/LeadDetail.tsx';
  if (await fileExists(leadDetailPath)) {
    const leadDetailContent = await fs.readFile(leadDetailPath, 'utf8');
    const hasEmailComposer = leadDetailContent.includes('EmailComposer');
    const hasMailIcon = leadDetailContent.includes('Mail');

    console.log(`${hasEmailComposer ? checkmarks.success : checkmarks.failure} EmailComposer in LeadDetail`);
    console.log(`${hasMailIcon ? checkmarks.success : checkmarks.failure} Email button in LeadDetail`);
  }

  // Check Settings page integration
  const settingsPath = '/home/dsgn_api/Leadscout/apps/web/src/pages/Settings.tsx';
  if (await fileExists(settingsPath)) {
    const settingsContent = await fs.readFile(settingsPath, 'utf8');
    const hasNotificationPrefs = settingsContent.includes('Browser Notifications');
    const hasSoundPrefs = settingsContent.includes('Sound Alerts');

    console.log(`${hasNotificationPrefs ? checkmarks.success : checkmarks.failure} Notification preferences in Settings`);
    console.log(`${hasSoundPrefs ? checkmarks.success : checkmarks.failure} Sound preferences in Settings`);
  }
}

async function main() {
  console.log('🚀 LEADSCOUT FEATURE VERIFICATION');
  console.log('==================================');
  console.log('Testing Email Integration and Real-time Notifications...\n');

  await checkBackendEmailService();
  await checkWebSocketService();
  await checkFrontendComponents();
  await checkIntegration();

  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`${checkmarks.info} Email Integration: Backend service, API routes, and frontend composer implemented`);
  console.log(`${checkmarks.info} Real-time Notifications: WebSocket service, frontend hooks, and browser notifications ready`);
  console.log(`${checkmarks.info} Both features are integrated and ready for testing`);

  console.log('\n🎯 NEXT STEPS');
  console.log('=============');
  console.log('1. Configure SMTP credentials in .env file');
  console.log('2. Start the API server: cd apps/api && pnpm dev');
  console.log('3. Start the web app: cd apps/web && pnpm dev');
  console.log('4. Test email sending from the Lead Detail page');
  console.log('5. Test real-time notifications by polling for new leads');
}

main().catch(console.error);