-- Update all existing users to Pro tier for testing
UPDATE "users" SET "subscriptionTier" = 'pro' WHERE "subscriptionTier" = 'free';

-- Set default to 'pro' instead of 'free'
ALTER TABLE "users" ALTER COLUMN "subscriptionTier" SET DEFAULT 'pro';
