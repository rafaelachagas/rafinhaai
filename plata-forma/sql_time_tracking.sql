ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_seconds_online INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_seconds_online INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ NULL;

CREATE OR REPLACE FUNCTION increment_time_online(p_user_id UUID, p_seconds INT)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_seconds_online = COALESCE(total_seconds_online, 0) + p_seconds
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
