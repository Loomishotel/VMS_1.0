-- =====================================================
-- MIGRATION: Add remarks column to Visit table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

ALTER TABLE "Visit" 
ADD COLUMN IF NOT EXISTS "remarks" TEXT;
