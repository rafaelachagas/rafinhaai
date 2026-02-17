-- Definir replica identity como FULL para garantir que todos os campos sejam transmitidos no Realtime
-- Isso é crucial para filtros e RLS em tempo real funcionarem corretamente.
ALTER TABLE public.messages REPLICA IDENTITY FULL;
