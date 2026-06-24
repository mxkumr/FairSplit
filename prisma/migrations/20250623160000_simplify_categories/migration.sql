UPDATE expenses SET category_id = NULL;

DELETE FROM categories;

INSERT INTO "categories" ("grouping", "name") VALUES
  ('General', 'General'),
  ('Food & Drink', 'Food & Drink'),
  ('Transportation', 'Transportation'),
  ('Home', 'Home'),
  ('Entertainment', 'Entertainment'),
  ('Travel', 'Travel'),
  ('Shopping', 'Shopping'),
  ('Healthcare', 'Healthcare'),
  ('Bills & Utilities', 'Bills & Utilities'),
  ('Education', 'Education');
