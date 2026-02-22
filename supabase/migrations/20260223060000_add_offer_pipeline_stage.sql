-- Add 'offer' to candidate_status enum for the pipeline board
ALTER TYPE candidate_status ADD VALUE IF NOT EXISTS 'offer';
