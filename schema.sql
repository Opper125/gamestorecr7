-- ============================================================
-- Complete Database Schema for Marketplace Platform
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- ────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT UNIQUE NOT NULL,
  gmail            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  pin_hash         TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'reseller', 'banned')),
  game_balance     NUMERIC(15,2) NOT NULL DEFAULT 0,
  profile_icon_url TEXT,
  is_banned        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE balance_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'claim')),
  amount       NUMERIC(15,2) NOT NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE banners (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url    TEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_banners (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url        TEXT NOT NULL,
  category_ids     UUID[] NOT NULL DEFAULT '{}',
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE home_category_titles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE home_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id         UUID REFERENCES home_category_titles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  flag_text        TEXT,
  discount_label   TEXT,
  icon_url         TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE home_products_type1 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES home_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  amount_label     TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  icon_url         TEXT,
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE home_products_type2 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES home_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  level            TEXT,
  rank             TEXT,
  game_coin_label  TEXT,
  game_coin_amount TEXT,
  version          TEXT,
  rp_count         INT,
  game_id          TEXT,
  social_links     JSONB DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE home_products_type3 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id      UUID REFERENCES home_categories(id) ON DELETE CASCADE,
  product_subtype  TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  attributes       JSONB DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menus (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  icon_url     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  flag_text        TEXT,
  discount_label   TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_products_type1 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  menu_category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  amount_label     TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  icon_url         TEXT,
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_products_type2 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  menu_category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  level            TEXT,
  rank             TEXT,
  game_coin_label  TEXT,
  game_coin_amount TEXT,
  version          TEXT,
  rp_count         INT,
  game_id          TEXT,
  social_links     JSONB DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_products_type3 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id          UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  menu_category_id UUID REFERENCES menu_categories(id) ON DELETE CASCADE,
  product_subtype  TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  attributes       JSONB DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE input_tables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  placeholder_text TEXT,
  product_ids      UUID[] DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_name         TEXT NOT NULL,
  account_name     TEXT NOT NULL,
  account_address  TEXT NOT NULL,
  note             TEXT,
  icon_url         TEXT,
  owner_type       TEXT NOT NULL DEFAULT 'admin' CHECK (owner_type IN ('admin', 'reseller')),
  owner_id         UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_source       TEXT NOT NULL,
  product_id           UUID,
  product_snapshot     JSONB NOT NULL DEFAULT '{}',
  quantity             INT NOT NULL DEFAULT 1,
  selected_attributes  JSONB DEFAULT '{}',
  input_table_values   JSONB DEFAULT '{}',
  unit_price           NUMERIC(15,2) NOT NULL,
  discount_applied     NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_price          NUMERIC(15,2) NOT NULL,
  promo_code           TEXT,
  promo_code_hash      TEXT,
  payment_method_id    UUID REFERENCES payment_methods(id),
  transaction_refs     JSONB DEFAULT '[]',
  location_id          UUID,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_message    TEXT,
  owner_type           TEXT NOT NULL DEFAULT 'admin' CHECK (owner_type IN ('admin', 'reseller')),
  owner_id             UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_locations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone_numbers   JSONB NOT NULL DEFAULT '[]',
  township        TEXT NOT NULL,
  district        TEXT NOT NULL,
  state_region    TEXT NOT NULL,
  street_address  TEXT NOT NULL,
  house_number    TEXT,
  is_selected     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  code_hash           TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('cash', 'discount')),
  cash_amount         NUMERIC(15,2),
  discount_pct        NUMERIC(5,2),
  applicable_scope    TEXT NOT NULL DEFAULT 'all' CHECK (applicable_scope IN ('all', 'categories')),
  applicable_ids      UUID[] DEFAULT '{}',
  max_uses            INT,
  used_count          INT NOT NULL DEFAULT 0,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promo_code_uses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id   UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, user_id)
);

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  gift_type       TEXT CHECK (gift_type IN ('balance', 'promo')),
  gift_amount     NUMERIC(15,2),
  promo_code_id   UUID REFERENCES promo_codes(id),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  is_claimed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('product', 'website')),
  target_id       UUID,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 15),
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name               TEXT NOT NULL,
  nrc_number              TEXT NOT NULL,
  date_of_birth           DATE NOT NULL,
  nrc_issue_date          DATE NOT NULL,
  address                 TEXT NOT NULL,
  phone_numbers           JSONB NOT NULL DEFAULT '[]',
  ward_support_letter_url TEXT NOT NULL,
  nrc_front_url           TEXT NOT NULL,
  nrc_back_url            TEXT NOT NULL,
  owner_photo_url         TEXT NOT NULL,
  kyc_status              TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
  dashboard_password_hash TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_menus (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id  UUID NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  icon_url     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id      UUID NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  menu_id          UUID REFERENCES reseller_menus(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  flag_text        TEXT,
  discount_label   TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_products_type1 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id      UUID NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES reseller_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  amount_label     TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  icon_url         TEXT,
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_products_type2 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id      UUID NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES reseller_categories(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  level            TEXT,
  rank             TEXT,
  game_coin_label  TEXT,
  game_coin_amount TEXT,
  version          TEXT,
  rp_count         INT,
  game_id          TEXT,
  social_links     JSONB DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_products_type3 (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id      UUID NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES reseller_categories(id) ON DELETE CASCADE,
  product_subtype  TEXT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  attributes       JSONB DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL,
  discount_pct     NUMERIC(5,2),
  stock            INT,
  stock_sold       INT NOT NULL DEFAULT 0,
  images           JSONB DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE premium_plans (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       TEXT NOT NULL,
  menu_limit                 INT,
  menu_category_limit        INT,
  products_type1_limit       INT,
  products_type2_limit       INT,
  products_type3_limits      JSONB DEFAULT '{}',
  home_category_limit        INT,
  home_products_type1_limit  INT,
  home_products_type2_limit  INT,
  home_products_type3_limits JSONB DEFAULT '{}',
  duration_days              INT NOT NULL,
  price                      NUMERIC(15,2) NOT NULL,
  bg_image_url               TEXT,
  stroke_color               TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id     UUID UNIQUE NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES premium_plans(id),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_admin_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type    TEXT NOT NULL CHECK (page_type IN ('topup', 'giftcard')),
  name         TEXT NOT NULL,
  icon_url     TEXT,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_game_assignments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code         TEXT NOT NULL,
  game_name         TEXT NOT NULL,
  admin_category_id UUID REFERENCES g2bulk_admin_categories(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_product_icons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   TEXT NOT NULL UNIQUE,
  icon_url     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  api_version      TEXT NOT NULL CHECK (api_version IN ('v1', 'v2')),
  game_code        TEXT,
  package_id       TEXT,
  player_id        TEXT,
  server_id        TEXT,
  g2bulk_order_id  TEXT,
  status           TEXT NOT NULL DEFAULT 'processing',
  delivery_items   JSONB DEFAULT '[]',
  amount_deducted  NUMERIC(15,2) NOT NULL,
  refunded         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_deposits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_mmk        NUMERIC(15,2) NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_refs  JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_note    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_price_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profit_pct     NUMERIC(7,4) NOT NULL DEFAULT 0,
  mmk_rate       NUMERIC(15,4) NOT NULL DEFAULT 1,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buying_pro_icons (
  rank_position  INT PRIMARY KEY CHECK (rank_position BETWEEN 1 AND 10),
  icon_url       TEXT NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────
-- DATABASE FUNCTIONS
-- ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION block_direct_balance_edit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.game_balance <> NEW.game_balance AND
     current_setting('app.allow_balance_update', TRUE) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Direct balance modification is not permitted.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_block_balance_edit
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION block_direct_balance_edit();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON user_locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION check_stock_sold_out()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock IS NOT NULL AND NEW.stock_sold >= NEW.stock THEN
    NEW.is_sold_out := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user_id UUID, p_amount NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  SET LOCAL app.allow_balance_update = 'true';
  UPDATE users SET game_balance = game_balance + p_amount, updated_at = NOW()
  WHERE id = p_user_id;
  INSERT INTO balance_transactions (user_id, type, amount, note)
  VALUES (p_user_id, 'credit', p_amount, p_note);
END;
$$;

CREATE OR REPLACE FUNCTION debit_user_balance(
  p_user_id UUID, p_amount NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT game_balance FROM users WHERE id = p_user_id) < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  SET LOCAL app.allow_balance_update = 'true';
  UPDATE users SET game_balance = game_balance - p_amount, updated_at = NOW()
  WHERE id = p_user_id;
  INSERT INTO balance_transactions (user_id, type, amount, note)
  VALUES (p_user_id, 'debit', p_amount, p_note);
END;
$$;

CREATE OR REPLACE FUNCTION approve_deposit(p_deposit_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID; v_amount NUMERIC;
BEGIN
  SELECT user_id, amount_mmk INTO v_user_id, v_amount
  FROM g2bulk_deposits WHERE id = p_deposit_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit not found or already processed'; END IF;
  UPDATE g2bulk_deposits SET status = 'approved', updated_at = NOW() WHERE id = p_deposit_id;
  PERFORM credit_user_balance(v_user_id, v_amount, 'Deposit approved: ' || p_deposit_id);
END;
$$;

CREATE OR REPLACE FUNCTION refund_g2bulk_order(p_order_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_order g2bulk_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM g2bulk_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.refunded THEN RETURN; END IF;
  PERFORM credit_user_balance(v_order.user_id, v_order.amount_deducted, 'Refund for order: ' || p_order_id);
  UPDATE g2bulk_orders SET refunded = TRUE, updated_at = NOW() WHERE id = p_order_id;
END;
$$;

-- ────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────

CREATE INDEX idx_users_username   ON users(username);
CREATE INDEX idx_users_gmail      ON users(gmail);
CREATE INDEX idx_users_role       ON users(role);
CREATE INDEX idx_orders_user_id   ON orders(user_id);
CREATE INDEX idx_orders_status    ON orders(status);
CREATE INDEX idx_orders_created   ON orders(created_at DESC);
CREATE INDEX idx_orders_owner     ON orders(owner_type, owner_id);
CREATE INDEX idx_balance_user     ON balance_transactions(user_id, created_at DESC);
CREATE INDEX idx_notif_user       ON notifications(user_id, is_read);
CREATE INDEX idx_hp1_category     ON home_products_type1(category_id);
CREATE INDEX idx_hp2_category     ON home_products_type2(category_id);
CREATE INDEX idx_hp3_category     ON home_products_type3(category_id);
CREATE INDEX idx_reviews_target   ON reviews(target_type, target_id);
CREATE INDEX idx_promo_code       ON promo_codes(code);
CREATE INDEX idx_g2bulk_ord_user  ON g2bulk_orders(user_id);
CREATE INDEX idx_g2bulk_dep_user  ON g2bulk_deposits(user_id, status);
CREATE INDEX idx_g2bulk_idem      ON g2bulk_orders(idempotency_key);
CREATE INDEX idx_reseller_user    ON reseller_accounts(user_id);
CREATE INDEX idx_reseller_subs    ON reseller_subscriptions(reseller_id, is_active);

-- ────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────

ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_accounts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2bulk_orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2bulk_deposits          ENABLE ROW LEVEL SECURITY;
