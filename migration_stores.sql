-- Añadir los nuevos campos a la tabla stores con valores predeterminados
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Actualizar tiendas existentes (opcional: podrías querer marcar algunas tiendas como principales)
UPDATE stores 
SET is_main = TRUE 
WHERE id IN (
  -- Aquí puedes especificar IDs de tiendas frecuentes que quieras marcar como principales
  -- Por ejemplo: 1, 2, 3
);

-- Opcionalmente, marcar algunas tiendas como ocultas
UPDATE stores 
SET is_hidden = TRUE 
WHERE id IN (
  -- Aquí puedes especificar IDs de tiendas que quieras ocultar
); 