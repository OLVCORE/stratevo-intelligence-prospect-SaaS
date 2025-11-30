-- Adicionar novos valores ao enum app_role
-- Cada ALTER TYPE precisa ser executado separadamente
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'direcao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerencia';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendedor';