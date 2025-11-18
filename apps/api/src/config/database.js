import { createClient } from '@supabase/supabase-js';
import config from './env.js';
import logger from '../utils/logger.js';

let supabaseClient = null;

function initializeDatabase() {
  try {
    supabaseClient = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: false
        }
      }
    );
    
    logger.info('Supabase client initialized successfully');
    return supabaseClient;
  } catch (error) {
    logger.error('Failed to initialize Supabase client', { error: error.message });
    throw new Error(`Database initialization failed: ${error.message}`);
  }
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseClient
      .from('keywords')
      .select('count')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error: error.message });
    throw error;
  }
}

function getDatabase() {
  if (!supabaseClient) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return supabaseClient;
}

// Initialize database immediately when module is imported
const db = initializeDatabase();

export { initializeDatabase, testDatabaseConnection, getDatabase };
export default db;
