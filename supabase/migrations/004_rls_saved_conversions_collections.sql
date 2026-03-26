-- RLS policies for saved_conversions and collections.
-- Permissive policies so inserts/selects succeed when RLS is on (e.g. if anon key is used).
-- Production uses service role (bypasses RLS). Tighten to user_id when Supabase Auth/JWT is integrated.

-- saved_conversions: was RLS-enabled in 001 but had no policies
CREATE POLICY "Allow all saved_conversions select" ON saved_conversions FOR SELECT USING (true);
CREATE POLICY "Allow all saved_conversions insert" ON saved_conversions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all saved_conversions update" ON saved_conversions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all saved_conversions delete" ON saved_conversions FOR DELETE USING (true);

-- collections: RLS enabled in 003 but had no policies
CREATE POLICY "Allow all collections select" ON collections FOR SELECT USING (true);
CREATE POLICY "Allow all collections insert" ON collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all collections update" ON collections FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all collections delete" ON collections FOR DELETE USING (true);
