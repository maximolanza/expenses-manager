-- Agregar el campo enabled a la tabla stores
ALTER TABLE "public"."stores" 
ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT TRUE;

-- Comentar el campo para documentación
COMMENT ON COLUMN "public"."stores"."enabled" IS 'Indica si la tienda está habilitada o deshabilitada (baja lógica)';

-- Crear un índice para mejorar el rendimiento de consultas filtradas por enabled
CREATE INDEX "idx_stores_enabled" ON "public"."stores" ("enabled");

-- Actualizar la política de Row Level Security si es necesaria
-- (Ajustar según tus necesidades de seguridad) 