-- Migration: 36_add_cancelled_to_enum
-- Description: Adds 'cancelled' to the enrollment_status enum to allow for subscription revocations.

-- We use a DO block to safely add the value if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'cancelled') THEN
    ALTER TYPE enrollment_status ADD VALUE 'cancelled';
  END IF;
END $$;
