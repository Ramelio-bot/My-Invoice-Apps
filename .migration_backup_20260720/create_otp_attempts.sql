-- Migration to create the OTP attempts table for brute-force protection

CREATE TABLE IF NOT EXISTS public.otp_attempts (
    email TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 1,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) but we don't need policies because 
-- Edge Functions will use the Service Role Key to bypass RLS.
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;
