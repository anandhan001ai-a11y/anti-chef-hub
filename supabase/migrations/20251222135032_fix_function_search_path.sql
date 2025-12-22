/*
  # Fix Function Search Path Security

  This migration recreates the update_updated_at_column function with an
  immutable search_path to prevent search path injection attacks.

  1. Security
    - Sets search_path to empty string to prevent mutable search path issues
    - Uses SECURITY INVOKER (default) for proper permission handling
*/

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;