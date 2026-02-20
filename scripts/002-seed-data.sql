-- Seed initial data for the restaurant

-- Insert sample burgers
INSERT INTO burgers (name, description, base_price, ingredients, is_available) VALUES
  ('Classic Burger', 'Hamburguesa clásica con carne, lechuga, tomate y cebolla', 2500.00, ARRAY['carne', 'lechuga', 'tomate', 'cebolla', 'pan'], true),
  ('Cheese Burger', 'Con queso cheddar derretido', 2800.00, ARRAY['carne', 'queso cheddar', 'lechuga', 'tomate', 'pan'], true),
  ('Double Burger', 'Doble carne para los más hambrientos', 3500.00, ARRAY['doble carne', 'queso', 'lechuga', 'tomate', 'cebolla', 'pan'], true),
  ('BBQ Burger', 'Con salsa BBQ y cebolla caramelizada', 3200.00, ARRAY['carne', 'salsa BBQ', 'cebolla caramelizada', 'queso', 'pan'], true),
  ('Bacon Burger', 'Con panceta crocante', 3400.00, ARRAY['carne', 'panceta', 'queso', 'lechuga', 'tomate', 'pan'], true),
  ('Veggie Burger', 'Medallón de vegetales', 2600.00, ARRAY['medallón vegetal', 'lechuga', 'tomate', 'cebolla', 'pan'], true);

-- Insert extras
INSERT INTO extras (name, category, price, is_available) VALUES
  -- Extras para hamburguesas
  ('Queso extra', 'extra', 400.00, true),
  ('Panceta', 'extra', 600.00, true),
  ('Huevo frito', 'extra', 350.00, true),
  ('Cebolla caramelizada', 'extra', 300.00, true),
  ('Jalapeños', 'extra', 250.00, true),
  ('Medallón extra', 'extra', 900.00, true),
  -- Bebidas
  ('Coca-Cola 500ml', 'drink', 800.00, true),
  ('Sprite 500ml', 'drink', 800.00, true),
  ('Fanta 500ml', 'drink', 800.00, true),
  ('Agua mineral 500ml', 'drink', 500.00, true),
  ('Cerveza artesanal', 'drink', 1200.00, true),
  -- Papas
  ('Papas fritas chicas', 'fries', 900.00, true),
  ('Papas fritas grandes', 'fries', 1300.00, true),
  ('Papas con cheddar', 'fries', 1500.00, true),
  ('Papas con bacon', 'fries', 1600.00, true),
  -- Combos
  ('Combo clásico (papas + bebida)', 'combo', 1500.00, true),
  ('Combo grande (papas grandes + bebida)', 'combo', 1900.00, true);

-- Insert sample customers
INSERT INTO customers (name, address, phone) VALUES
  ('Juan Pérez', 'Av. Corrientes 1234, CABA', '11-1234-5678'),
  ('María García', 'Calle Florida 567, CABA', '11-8765-4321'),
  ('Carlos López', 'Av. Santa Fe 890, CABA', '11-5555-1234');
