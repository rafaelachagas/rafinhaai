-- RPC for bulk updating module order
CREATE OR REPLACE FUNCTION update_modules_order(module_orders jsonb)
RETURNS void AS $$
DECLARE
  m jsonb;
BEGIN
  FOR m IN SELECT * FROM jsonb_array_elements(module_orders) LOOP
    UPDATE modules
    SET order_index = (m->>'order_index')::int
    WHERE id = (m->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
