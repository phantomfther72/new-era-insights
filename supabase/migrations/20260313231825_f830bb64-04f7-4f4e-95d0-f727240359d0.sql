
-- Datasets table to track uploaded files
CREATE TABLE public.datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'text/csv',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'validated', 'imported', 'error')),
  row_count INTEGER,
  columns JSONB,
  preview_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sales records table
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  record_date DATE,
  region TEXT,
  copies_sold INTEGER,
  revenue NUMERIC(12,2),
  category TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  subscriber_id TEXT,
  name TEXT,
  region TEXT,
  plan TEXT,
  start_date DATE,
  age_group TEXT,
  preferred_category TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  delivered_copies INTEGER DEFAULT 0,
  sold_copies INTEGER DEFAULT 0,
  demand_trend TEXT DEFAULT 'stable',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ad sales table
CREATE TABLE public.ad_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  ad_date DATE,
  client_name TEXT,
  category TEXT,
  revenue NUMERIC(12,2),
  placement TEXT,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Forecasts table
CREATE TABLE public.forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  predicted_value NUMERIC(12,2),
  confidence_low NUMERIC(12,2),
  confidence_high NUMERIC(12,2),
  model_name TEXT DEFAULT 'baseline',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (will be locked down when auth is added)
CREATE POLICY "Allow all access to datasets" ON public.datasets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sales_records" ON public.sales_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to subscribers" ON public.subscribers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to regions" ON public.regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ad_sales" ON public.ad_sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to forecasts" ON public.forecasts FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);
CREATE POLICY "Allow all access to datasets bucket" ON storage.objects FOR ALL USING (bucket_id = 'datasets') WITH CHECK (bucket_id = 'datasets');
