
CREATE TABLE public.circulation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE NOT NULL,
  period_start DATE,
  period_end DATE,
  client TEXT,
  delivered INTEGER DEFAULT 0,
  returned INTEGER DEFAULT 0,
  returned_percentage NUMERIC(5,2) DEFAULT 0,
  sold INTEGER DEFAULT 0,
  sell_through_rate NUMERIC(5,2) DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.circulation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to circulation_records" ON public.circulation_records FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.circulation_records;
