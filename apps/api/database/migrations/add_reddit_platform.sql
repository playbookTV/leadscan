-- Migration: Add Reddit platform to leads table
-- Date: 2025-11-18
-- Purpose: Enable Reddit as a platform for lead generation

-- Drop existing CHECK constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_platform_check;

-- Add new CHECK constraint that includes 'reddit'
ALTER TABLE leads ADD CONSTRAINT leads_platform_check
  CHECK (platform IN ('twitter', 'linkedin', 'reddit'));

-- Verify constraint was added
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'leads'::regclass
AND conname = 'leads_platform_check';
