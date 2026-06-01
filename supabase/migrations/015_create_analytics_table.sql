-- Create the broadcast_analytics table to track dynamic click geolocation
CREATE TABLE IF NOT EXISTS public.broadcast_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id TEXT NOT NULL,
    city TEXT,
    region TEXT,
    country TEXT,
    device_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.broadcast_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous inserts (so visitors clicking the link can trigger tracking insert)
CREATE POLICY "Allow public anonymous inserts" 
ON public.broadcast_analytics 
FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (true);

-- Allow authenticated admins and service role to read analytics
CREATE POLICY "Allow read access to authenticated users and service role"
ON public.broadcast_analytics
FOR SELECT
TO authenticated, service_role
USING (true);

-- Create index for faster querying by broadcast_id
CREATE INDEX IF NOT EXISTS idx_broadcast_analytics_broadcast_id 
ON public.broadcast_analytics(broadcast_id);
