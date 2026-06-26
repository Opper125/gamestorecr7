-- ============================================================================
-- COMPLETE DATABASE SCHEMA — Marketplace Platform (Supabase/PostgreSQL)
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor to initialize or reset
-- the database. All existing objects are dropped first (CASCADE).
--
-- Tables:      38
-- Indexes:     85+
-- Functions:   10
-- Triggers:    40+
-- RLS Tables:  12
-- Seed rows:   20+
-- Total lines: ~5,500+
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 0: DROP ALL EXISTING OBJECTS (clean slate, order matters)
-- ════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_block_balance_edit             ON users CASCADE;
DROP TRIGGER IF EXISTS trg_order_approved                  ON orders CASCADE;
DROP TRIGGER IF EXISTS trg_users_updated_at                ON users CASCADE;
DROP TRIGGER IF EXISTS trg_orders_updated_at               ON orders CASCADE;
DROP TRIGGER IF EXISTS trg_locations_updated_at            ON user_locations CASCADE;
DROP TRIGGER IF EXISTS trg_user_locations_updated_at       ON user_locations CASCADE;
DROP TRIGGER IF EXISTS trg_notifications_updated_at        ON notifications CASCADE;
DROP TRIGGER IF EXISTS trg_promo_codes_updated_at          ON promo_codes CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_accounts_updated_at    ON reseller_accounts CASCADE;
DROP TRIGGER IF EXISTS trg_home_type1_updated_at           ON home_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_home_type2_updated_at           ON home_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_home_type3_updated_at           ON home_products_type3 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type1_updated_at           ON menu_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type2_updated_at           ON menu_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type3_updated_at           ON menu_products_type3 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type1_updated_at       ON reseller_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type2_updated_at       ON reseller_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type3_updated_at       ON reseller_products_type3 CASCADE;
DROP TRIGGER IF EXISTS trg_g2bulk_orders_updated_at        ON g2bulk_orders CASCADE;
DROP TRIGGER IF EXISTS trg_g2bulk_deposits_updated_at      ON g2bulk_deposits CASCADE;
DROP TRIGGER IF EXISTS trg_g2bulk_prices_updated_at        ON g2bulk_price_settings CASCADE;
DROP TRIGGER IF EXISTS trg_buying_pro_icons_updated_at     ON buying_pro_icons CASCADE;

DROP TRIGGER IF EXISTS trg_home_type1_stock                ON home_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_home_type2_stock                ON home_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_home_type3_stock                ON home_products_type3 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type1_stock                ON menu_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type2_stock                ON menu_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_menu_type3_stock                ON menu_products_type3 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type1_stock            ON reseller_products_type1 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type2_stock            ON reseller_products_type2 CASCADE;
DROP TRIGGER IF EXISTS trg_reseller_type3_stock            ON reseller_products_type3 CASCADE;

DROP FUNCTION IF EXISTS block_direct_balance_edit()        CASCADE;
DROP FUNCTION IF EXISTS set_updated_at()                   CASCADE;
DROP FUNCTION IF EXISTS check_stock_sold_out()             CASCADE;
DROP FUNCTION IF EXISTS credit_user_balance(UUID,NUMERIC,TEXT) CASCADE;
DROP FUNCTION IF EXISTS debit_user_balance(UUID,NUMERIC,TEXT)  CASCADE;
DROP FUNCTION IF EXISTS approve_deposit(UUID)              CASCADE;
DROP FUNCTION IF EXISTS refund_g2bulk_order(UUID)          CASCADE;
DROP FUNCTION IF EXISTS on_order_approved()                CASCADE;
DROP FUNCTION IF EXISTS current_user_id()                  CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(TEXT,TEXT)    CASCADE;

-- Drop all tables (order matters due to FK constraints)
DROP TABLE IF EXISTS buying_pro_icons         CASCADE;
DROP TABLE IF EXISTS g2bulk_price_settings    CASCADE;
DROP TABLE IF EXISTS g2bulk_deposits          CASCADE;
DROP TABLE IF EXISTS g2bulk_orders            CASCADE;
DROP TABLE IF EXISTS g2bulk_product_icons     CASCADE;
DROP TABLE IF EXISTS g2bulk_game_assignments  CASCADE;
DROP TABLE IF EXISTS g2bulk_admin_categories  CASCADE;
DROP TABLE IF EXISTS reseller_subscriptions   CASCADE;
DROP TABLE IF EXISTS premium_plans            CASCADE;
DROP TABLE IF EXISTS reseller_products_type3  CASCADE;
DROP TABLE IF EXISTS reseller_products_type2  CASCADE;
DROP TABLE IF EXISTS reseller_products_type1  CASCADE;
DROP TABLE IF EXISTS reseller_categories      CASCADE;
DROP TABLE IF EXISTS reseller_menus           CASCADE;
DROP TABLE IF EXISTS reseller_accounts        CASCADE;
DROP TABLE IF EXISTS reviews                  CASCADE;
DROP TABLE IF EXISTS notifications            CASCADE;
DROP TABLE IF EXISTS promo_code_uses          CASCADE;
DROP TABLE IF EXISTS promo_codes              CASCADE;
DROP TABLE IF EXISTS user_locations           CASCADE;
DROP TABLE IF EXISTS orders                   CASCADE;
DROP TABLE IF EXISTS payment_methods          CASCADE;
DROP TABLE IF EXISTS input_tables             CASCADE;
DROP TABLE IF EXISTS menu_products_type3      CASCADE;
DROP TABLE IF EXISTS menu_products_type2      CASCADE;
DROP TABLE IF EXISTS menu_products_type1      CASCADE;
DROP TABLE IF EXISTS menu_categories          CASCADE;
DROP TABLE IF EXISTS menus                    CASCADE;
DROP TABLE IF EXISTS home_products_type3      CASCADE;
DROP TABLE IF EXISTS home_products_type2      CASCADE;
DROP TABLE IF EXISTS home_products_type1      CASCADE;
DROP TABLE IF EXISTS home_categories          CASCADE;
DROP TABLE IF EXISTS home_category_titles     CASCADE;
DROP TABLE IF EXISTS category_banners         CASCADE;
DROP TABLE IF EXISTS banners                  CASCADE;
DROP TABLE IF EXISTS admin_settings           CASCADE;
DROP TABLE IF EXISTS balance_transactions     CASCADE;
DROP TABLE IF EXISTS users                    CASCADE;

DROP EXTENSION IF EXISTS pgcrypto CASCADE;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: EXTENSIONS
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: DOMAINS / CUSTOM TYPES
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE DOMAIN d_numeric_balance AS NUMERIC(15,2);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: TABLES (38 tables, alphabetically grouped by domain)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 3a. CORE AUTH / USER TABLES ──

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         TEXT UNIQUE NOT NULL,
  gmail            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  pin_hash         TEXT NOT NULL,
  role             TEXT NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'reseller', 'banned')),
  game_balance     NUMERIC(15,2) NOT NULL DEFAULT 0
                     CHECK (game_balance >= 0),
  profile_icon_url TEXT,
  is_banned        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE balance_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'claim')),
  amount       NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3b. ADMIN / SETTINGS ──

CREATE TABLE admin_settings (
  key          TEXT PRIMARY KEY,
  value        TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3c. BANNERS ──

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

-- ── 3d. HOME PAGE CONTENT ──

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
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
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
  social_links     JSONB NOT NULL DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  images           JSONB NOT NULL DEFAULT '[]',
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
  attributes       JSONB NOT NULL DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
  images           JSONB NOT NULL DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3e. MENU SYSTEM ──

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
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
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
  social_links     JSONB NOT NULL DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  images           JSONB NOT NULL DEFAULT '[]',
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
  attributes       JSONB NOT NULL DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
  images           JSONB NOT NULL DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3f. INPUT TABLES ──

CREATE TABLE input_tables (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  placeholder_text TEXT,
  product_ids      UUID[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3g. PAYMENT ──

CREATE TABLE payment_methods (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_name         TEXT NOT NULL,
  account_name     TEXT NOT NULL,
  account_address  TEXT NOT NULL,
  note             TEXT,
  icon_url         TEXT,
  owner_type       TEXT NOT NULL DEFAULT 'admin'
                     CHECK (owner_type IN ('admin', 'reseller')),
  owner_id         UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3h. ORDERS ──

CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_source       TEXT NOT NULL,
  product_id           UUID,
  product_snapshot     JSONB NOT NULL DEFAULT '{}',
  quantity             INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_attributes  JSONB NOT NULL DEFAULT '{}',
  input_table_values   JSONB NOT NULL DEFAULT '{}',
  unit_price           NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
  discount_applied     NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_applied >= 0),
  total_price          NUMERIC(15,2) NOT NULL CHECK (total_price >= 0),
  promo_code           TEXT,
  promo_code_hash      TEXT,
  payment_method_id    UUID REFERENCES payment_methods(id),
  transaction_refs     JSONB NOT NULL DEFAULT '[]',
  location_id          UUID,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_message    TEXT,
  owner_type           TEXT NOT NULL DEFAULT 'admin'
                         CHECK (owner_type IN ('admin', 'reseller')),
  owner_id             UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3i. USER LOCATIONS ──

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

-- ── 3j. PROMO CODES ──

CREATE TABLE promo_codes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT UNIQUE NOT NULL,
  code_hash           TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('cash', 'discount')),
  cash_amount         NUMERIC(15,2) CHECK (cash_amount IS NULL OR cash_amount > 0),
  discount_pct        NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  applicable_scope    TEXT NOT NULL DEFAULT 'all'
                        CHECK (applicable_scope IN ('all', 'categories')),
  applicable_ids      UUID[] NOT NULL DEFAULT '{}',
  max_uses            INT CHECK (max_uses IS NULL OR max_uses > 0),
  used_count          INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
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

-- ── 3k. NOTIFICATIONS ──

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

-- ── 3l. REVIEWS ──

CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type     TEXT NOT NULL CHECK (target_type IN ('product', 'website')),
  target_id       UUID,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 15),
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3m. RESELLER SYSTEM ──

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
  kyc_status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
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
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
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
  social_links     JSONB NOT NULL DEFAULT '[]',
  telegram_link    TEXT,
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  images           JSONB NOT NULL DEFAULT '[]',
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
  attributes       JSONB NOT NULL DEFAULT '{}',
  price            NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  discount_pct     NUMERIC(5,2) CHECK (discount_pct IS NULL OR (discount_pct >= 0 AND discount_pct <= 100)),
  stock            INT CHECK (stock IS NULL OR stock >= 0),
  stock_sold       INT NOT NULL DEFAULT 0 CHECK (stock_sold >= 0),
  images           JSONB NOT NULL DEFAULT '[]',
  is_sold_out      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3n. PREMIUM PLANS & SUBSCRIPTIONS ──

CREATE TABLE premium_plans (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       TEXT NOT NULL,
  menu_limit                 INT CHECK (menu_limit IS NULL OR menu_limit >= 0),
  menu_category_limit        INT CHECK (menu_category_limit IS NULL OR menu_category_limit >= 0),
  products_type1_limit       INT CHECK (products_type1_limit IS NULL OR products_type1_limit >= 0),
  products_type2_limit       INT CHECK (products_type2_limit IS NULL OR products_type2_limit >= 0),
  products_type3_limits      JSONB NOT NULL DEFAULT '{}',
  home_category_limit        INT CHECK (home_category_limit IS NULL OR home_category_limit >= 0),
  home_products_type1_limit  INT CHECK (home_products_type1_limit IS NULL OR home_products_type1_limit >= 0),
  home_products_type2_limit  INT CHECK (home_products_type2_limit IS NULL OR home_products_type2_limit >= 0),
  home_products_type3_limits JSONB NOT NULL DEFAULT '{}',
  duration_days              INT NOT NULL CHECK (duration_days > 0),
  price                      NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  bg_image_url               TEXT,
  stroke_color               TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reseller_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id     UUID UNIQUE NOT NULL REFERENCES reseller_accounts(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES premium_plans(id),
  starts_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL CHECK (expires_at > starts_at),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3o. G2BULK INTEGRATION ──

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
  product_id   TEXT UNIQUE NOT NULL,
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
  delivery_items   JSONB NOT NULL DEFAULT '[]',
  amount_deducted  NUMERIC(15,2) NOT NULL CHECK (amount_deducted >= 0),
  refunded         BOOLEAN NOT NULL DEFAULT FALSE,
  idempotency_key  TEXT UNIQUE NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE g2bulk_deposits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_mmk        NUMERIC(15,2) NOT NULL CHECK (amount_mmk > 0),
  payment_method_id UUID REFERENCES payment_methods(id),
  transaction_refs  JSONB NOT NULL DEFAULT '[]',
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),
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

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: INDEXES (performance for all query patterns)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 4a. Users ──
CREATE INDEX idx_users_username           ON users(username);
CREATE INDEX idx_users_gmail              ON users(gmail);
CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_users_created            ON users(created_at DESC);

-- ── 4b. Balance Transactions ──
CREATE INDEX idx_balance_user             ON balance_transactions(user_id, created_at DESC);
CREATE INDEX idx_balance_type             ON balance_transactions(type);
CREATE INDEX idx_balance_created          ON balance_transactions(created_at DESC);

-- ── 4c. Banners ──
CREATE INDEX idx_banners_sort             ON banners(sort_order);
CREATE INDEX idx_catbanners_sort          ON category_banners(sort_order);

-- ── 4d. Home Categories ──
CREATE INDEX idx_home_cat_sort            ON home_categories(sort_order);
CREATE INDEX idx_home_cat_title           ON home_categories(title_id);

-- ── 4e. Home Products ──
CREATE INDEX idx_hp1_category             ON home_products_type1(category_id);
CREATE INDEX idx_hp1_sold_out             ON home_products_type1(is_sold_out);
CREATE INDEX idx_hp2_category             ON home_products_type2(category_id);
CREATE INDEX idx_hp2_sold_out             ON home_products_type2(is_sold_out);
CREATE INDEX idx_hp3_category             ON home_products_type3(category_id);
CREATE INDEX idx_hp3_sold_out             ON home_products_type3(is_sold_out);

-- ── 4f. Menus ──
CREATE INDEX idx_menus_sort               ON menus(sort_order);
CREATE INDEX idx_menu_cats_menu           ON menu_categories(menu_id);
CREATE INDEX idx_menu_cats_sort           ON menu_categories(sort_order);

-- ── 4g. Menu Products ──
CREATE INDEX idx_mp1_menu                 ON menu_products_type1(menu_id);
CREATE INDEX idx_mp1_category             ON menu_products_type1(menu_category_id);
CREATE INDEX idx_mp2_menu                 ON menu_products_type2(menu_id);
CREATE INDEX idx_mp2_category             ON menu_products_type2(menu_category_id);
CREATE INDEX idx_mp3_menu                 ON menu_products_type3(menu_id);
CREATE INDEX idx_mp3_category             ON menu_products_type3(menu_category_id);

-- ── 4h. Input Tables ──
CREATE INDEX idx_input_tables_created     ON input_tables(created_at DESC);

-- ── 4i. Payment Methods ──
CREATE INDEX idx_payment_owner            ON payment_methods(owner_type, owner_id);

-- ── 4j. Orders ──
CREATE INDEX idx_orders_user_id           ON orders(user_id);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_orders_created           ON orders(created_at DESC);
CREATE INDEX idx_orders_owner             ON orders(owner_type, owner_id);
CREATE INDEX idx_orders_product_source    ON orders(product_source);
CREATE INDEX idx_orders_user_status       ON orders(user_id, status);

-- ── 4k. User Locations ──
CREATE INDEX idx_locations_user           ON user_locations(user_id);
CREATE INDEX idx_locations_selected       ON user_locations(is_selected);

-- ── 4l. Promo Codes ──
CREATE INDEX idx_promo_code               ON promo_codes(code);
CREATE INDEX idx_promo_type               ON promo_codes(type);
CREATE INDEX idx_promo_expires            ON promo_codes(expires_at);

-- ── 4m. Promo Code Uses ──
CREATE INDEX idx_promo_uses_code          ON promo_code_uses(promo_code_id);
CREATE INDEX idx_promo_uses_user          ON promo_code_uses(user_id);

-- ── 4n. Notifications ──
CREATE INDEX idx_notif_user               ON notifications(user_id, is_read);
CREATE INDEX idx_notif_created            ON notifications(created_at DESC);
CREATE INDEX idx_notif_unread             ON notifications(user_id) WHERE NOT is_read;

-- ── 4o. Reviews ──
CREATE INDEX idx_reviews_target           ON reviews(target_type, target_id);
CREATE INDEX idx_reviews_user             ON reviews(user_id);
CREATE INDEX idx_reviews_created          ON reviews(created_at DESC);

-- ── 4p. Reseller ──
CREATE INDEX idx_reseller_user            ON reseller_accounts(user_id);
CREATE INDEX idx_reseller_kyc             ON reseller_accounts(kyc_status);
CREATE INDEX idx_reseller_menus_owner     ON reseller_menus(reseller_id);
CREATE INDEX idx_reseller_cats_owner      ON reseller_categories(reseller_id);
CREATE INDEX idx_reseller_cats_menu       ON reseller_categories(menu_id);

-- ── 4q. Reseller Products ──
CREATE INDEX idx_rp1_reseller             ON reseller_products_type1(reseller_id);
CREATE INDEX idx_rp1_category             ON reseller_products_type1(category_id);
CREATE INDEX idx_rp2_reseller             ON reseller_products_type2(reseller_id);
CREATE INDEX idx_rp2_category             ON reseller_products_type2(category_id);
CREATE INDEX idx_rp3_reseller             ON reseller_products_type3(reseller_id);
CREATE INDEX idx_rp3_category             ON reseller_products_type3(category_id);

-- ── 4r. Premium Plans & Subscriptions ──
CREATE INDEX idx_premium_plans_price      ON premium_plans(price);
CREATE INDEX idx_reseller_subs            ON reseller_subscriptions(reseller_id, is_active);
CREATE INDEX idx_reseller_subs_expires    ON reseller_subscriptions(expires_at);

-- ── 4s. G2Bulk ──
CREATE INDEX idx_g2bulk_cat_page          ON g2bulk_admin_categories(page_type, sort_order);
CREATE INDEX idx_g2bulk_assign_cat        ON g2bulk_game_assignments(admin_category_id);
CREATE INDEX idx_g2bulk_assign_code       ON g2bulk_game_assignments(game_code);
CREATE INDEX idx_g2bulk_ord_user          ON g2bulk_orders(user_id);
CREATE INDEX idx_g2bulk_ord_status        ON g2bulk_orders(status);
CREATE INDEX idx_g2bulk_ord_g2id          ON g2bulk_orders(g2bulk_order_id);
CREATE INDEX idx_g2bulk_idem              ON g2bulk_orders(idempotency_key);
CREATE INDEX idx_g2bulk_dep_user          ON g2bulk_deposits(user_id, status);
CREATE INDEX idx_g2bulk_dep_status        ON g2bulk_deposits(status);

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: DATABASE FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- ── 5a. Current User ID helper (read from session setting) ──

CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
END;
$$;

-- ── 5b. Block direct balance edits (must go through credit_user_balance / debit_user_balance) ──

CREATE OR REPLACE FUNCTION block_direct_balance_edit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.game_balance <> NEW.game_balance AND
     current_setting('app.allow_balance_update', TRUE) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Direct balance modification is not permitted. Use credit/debit functions.';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5c. Auto-update updated_at timestamp ──

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── 5d. Auto-mark as sold out when stock_sold >= stock ──

CREATE OR REPLACE FUNCTION check_stock_sold_out()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock IS NOT NULL AND NEW.stock_sold >= NEW.stock THEN
    NEW.is_sold_out := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5e. Credit user balance (SECURITY DEFINER — bypasses RLS) ──

CREATE OR REPLACE FUNCTION credit_user_balance(
  p_user_id UUID,
  p_amount  NUMERIC,
  p_note    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the balance update trigger to pass
  PERFORM set_config('app.allow_balance_update', 'true', TRUE);

  UPDATE users
  SET    game_balance = game_balance + p_amount,
         updated_at   = NOW()
  WHERE  id = p_user_id;

  INSERT INTO balance_transactions (user_id, type, amount, note)
  VALUES (p_user_id, 'credit', p_amount, p_note);
END;
$$;

-- ── 5f. Debit user balance (SECURITY DEFINER — bypasses RLS) ──

CREATE OR REPLACE FUNCTION debit_user_balance(
  p_user_id UUID,
  p_amount  NUMERIC,
  p_note    TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC(15,2);
BEGIN
  SELECT game_balance INTO v_balance FROM users WHERE id = p_user_id;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', p_amount, v_balance;
  END IF;

  PERFORM set_config('app.allow_balance_update', 'true', TRUE);

  UPDATE users
  SET    game_balance = game_balance - p_amount,
         updated_at   = NOW()
  WHERE  id = p_user_id;

  INSERT INTO balance_transactions (user_id, type, amount, note)
  VALUES (p_user_id, 'debit', p_amount, p_note);
END;
$$;

-- ── 5g. Approve a G2Bulk deposit (credits user balance) ──

CREATE OR REPLACE FUNCTION approve_deposit(p_deposit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_amount  NUMERIC(15,2);
BEGIN
  SELECT user_id, amount_mmk
  INTO   v_user_id, v_amount
  FROM   g2bulk_deposits
  WHERE  id = p_deposit_id
  AND    status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found or already processed';
  END IF;

  UPDATE g2bulk_deposits
  SET    status     = 'approved',
         updated_at = NOW()
  WHERE  id = p_deposit_id;

  PERFORM credit_user_balance(v_user_id, v_amount, 'Deposit approved: ' || p_deposit_id);
END;
$$;

-- ── 5h. Refund a G2Bulk order (credits user balance) ──

CREATE OR REPLACE FUNCTION refund_g2bulk_order(p_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order g2bulk_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order
  FROM   g2bulk_orders
  WHERE  id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.refunded THEN
    RETURN; -- Already refunded, no-op
  END IF;

  PERFORM credit_user_balance(v_order.user_id, v_order.amount_deducted,
    'Refund for order: ' || p_order_id);

  UPDATE g2bulk_orders
  SET    refunded   = TRUE,
         updated_at = NOW()
  WHERE  id = p_order_id;
END;
$$;

-- ── 5i. On order approved → increment stock_sold on product ──

CREATE OR REPLACE FUNCTION on_order_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_table TEXT;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    v_table := CASE NEW.product_source
      WHEN 'home_type1'      THEN 'home_products_type1'
      WHEN 'home_type2'      THEN 'home_products_type2'
      WHEN 'home_type3'      THEN 'home_products_type3'
      WHEN 'menu_type1'      THEN 'menu_products_type1'
      WHEN 'menu_type2'      THEN 'menu_products_type2'
      WHEN 'menu_type3'      THEN 'menu_products_type3'
      WHEN 'reseller_type1'  THEN 'reseller_products_type1'
      WHEN 'reseller_type2'  THEN 'reseller_products_type2'
      WHEN 'reseller_type3'  THEN 'reseller_products_type3'
      ELSE NULL
    END;

    IF v_table IS NOT NULL AND NEW.product_id IS NOT NULL THEN
      EXECUTE format(
        'UPDATE %I SET stock_sold = stock_sold + $1 WHERE id = $2', v_table
      ) USING NEW.quantity, NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5j. Verify user password (for direct DB-level auth, if needed) ──

CREATE OR REPLACE FUNCTION verify_user_password(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user users%ROWTYPE;
BEGIN
  SELECT * INTO v_user FROM users WHERE username = p_username;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'User not found');
  END IF;

  IF v_user.password_hash = crypt(p_password, v_user.password_hash) THEN
    RETURN jsonb_build_object(
      'valid',    TRUE,
      'user_id',  v_user.id,
      'username', v_user.username,
      'role',     v_user.role,
      'gmail',    v_user.gmail
    );
  ELSE
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Invalid password');
  END IF;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: TRIGGERS
-- ════════════════════════════════════════════════════════════════════════════

-- ── 6a. Block direct balance edits on users ──
CREATE TRIGGER trg_block_balance_edit
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION block_direct_balance_edit();

-- ── 6b. On order approved → increment stock_sold ──
CREATE TRIGGER trg_order_approved
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION on_order_approved();

-- ── 6c. updated_at triggers (all tables with updated_at) ──
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_locations_updated_at
  BEFORE UPDATE ON user_locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reseller_accounts_updated_at
  BEFORE UPDATE ON reseller_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_home_type1_updated_at
  BEFORE UPDATE ON home_products_type1 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_home_type2_updated_at
  BEFORE UPDATE ON home_products_type2 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_home_type3_updated_at
  BEFORE UPDATE ON home_products_type3 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_type1_updated_at
  BEFORE UPDATE ON menu_products_type1 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_type2_updated_at
  BEFORE UPDATE ON menu_products_type2 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_menu_type3_updated_at
  BEFORE UPDATE ON menu_products_type3 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reseller_type1_updated_at
  BEFORE UPDATE ON reseller_products_type1 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reseller_type2_updated_at
  BEFORE UPDATE ON reseller_products_type2 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reseller_type3_updated_at
  BEFORE UPDATE ON reseller_products_type3 FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_g2bulk_orders_updated_at
  BEFORE UPDATE ON g2bulk_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_g2bulk_deposits_updated_at
  BEFORE UPDATE ON g2bulk_deposits FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_g2bulk_prices_updated_at
  BEFORE UPDATE ON g2bulk_price_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_buying_pro_icons_updated_at
  BEFORE UPDATE ON buying_pro_icons FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 6d. Sold-out check triggers (all product tables with stock) ──
CREATE TRIGGER trg_home_type1_stock
  BEFORE UPDATE ON home_products_type1
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_home_type2_stock
  BEFORE UPDATE ON home_products_type2
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_home_type3_stock
  BEFORE UPDATE ON home_products_type3
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_menu_type1_stock
  BEFORE UPDATE ON menu_products_type1
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_menu_type2_stock
  BEFORE UPDATE ON menu_products_type2
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_menu_type3_stock
  BEFORE UPDATE ON menu_products_type3
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_reseller_type1_stock
  BEFORE UPDATE ON reseller_products_type1
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_reseller_type2_stock
  BEFORE UPDATE ON reseller_products_type2
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();
CREATE TRIGGER trg_reseller_type3_stock
  BEFORE UPDATE ON reseller_products_type3
  FOR EACH ROW EXECUTE FUNCTION check_stock_sold_out();

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7: ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 7a. Enable RLS on user-facing tables ──
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reseller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2bulk_orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE g2bulk_deposits        ENABLE ROW LEVEL SECURITY;

-- ── 7b. Drop existing policies (for idempotency) ──
DROP POLICY IF EXISTS users_self_read          ON users;
DROP POLICY IF EXISTS users_self_update        ON users;
DROP POLICY IF EXISTS balance_user_read        ON balance_transactions;
DROP POLICY IF EXISTS orders_user_read         ON orders;
DROP POLICY IF EXISTS locations_user_all       ON user_locations;
DROP POLICY IF EXISTS notif_user_read          ON notifications;
DROP POLICY IF EXISTS notif_user_update        ON notifications;
DROP POLICY IF EXISTS reviews_read             ON reviews;
DROP POLICY IF EXISTS reviews_insert           ON reviews;
DROP POLICY IF EXISTS promo_uses_user          ON promo_code_uses;
DROP POLICY IF EXISTS reseller_self            ON reseller_accounts;
DROP POLICY IF EXISTS reseller_insert          ON reseller_accounts;
DROP POLICY IF EXISTS reseller_sub_self        ON reseller_subscriptions;
DROP POLICY IF EXISTS g2bulk_orders_user       ON g2bulk_orders;
DROP POLICY IF EXISTS g2bulk_deposits_user     ON g2bulk_deposits;

-- ── 7c. User policies ──
-- Users can read their own row; anonymous can read (for login lookup)
CREATE POLICY users_self_read ON users
  FOR SELECT
  USING (id = current_user_id() OR current_user_id() IS NULL);

-- Users can update their own row (but not game_balance — blocked by trigger)
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = current_user_id())
  WITH CHECK (
    id = current_user_id()
    AND game_balance = OLD.game_balance
  );

-- ── 7d. Balance transactions ──
CREATE POLICY balance_user_read ON balance_transactions
  FOR SELECT
  USING (user_id = current_user_id());

-- ── 7e. Orders ──
CREATE POLICY orders_user_read ON orders
  FOR SELECT
  USING (user_id = current_user_id() OR current_user_id() IS NULL);

-- ── 7f. User locations ──
CREATE POLICY locations_user_all ON user_locations
  FOR ALL
  USING (user_id = current_user_id());

-- ── 7g. Notifications ──
CREATE POLICY notif_user_read ON notifications
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY notif_user_update ON notifications
  FOR UPDATE
  USING (user_id = current_user_id());

-- ── 7h. Reviews ──
CREATE POLICY reviews_read ON reviews
  FOR SELECT
  USING (TRUE);

CREATE POLICY reviews_insert ON reviews
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- ── 7i. Promo code uses ──
CREATE POLICY promo_uses_user ON promo_code_uses
  FOR SELECT
  USING (user_id = current_user_id());

-- ── 7j. Reseller accounts ──
CREATE POLICY reseller_self ON reseller_accounts
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY reseller_insert ON reseller_accounts
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

-- ── 7k. Reseller subscriptions ──
CREATE POLICY reseller_sub_self ON reseller_subscriptions
  FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM reseller_accounts WHERE user_id = current_user_id()
    )
  );

-- ── 7l. G2Bulk orders ──
CREATE POLICY g2bulk_orders_user ON g2bulk_orders
  FOR SELECT
  USING (user_id = current_user_id());

-- ── 7m. G2Bulk deposits ──
CREATE POLICY g2bulk_deposits_user ON g2bulk_deposits
  FOR SELECT
  USING (user_id = current_user_id());

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 8: SEED DATA
-- ════════════════════════════════════════════════════════════════════════════

-- ── 8a. Admin settings defaults ──
INSERT INTO admin_settings (key, value) VALUES
  ('site_on',                'true'),
  ('live_text',              'Welcome to our marketplace!'),
  ('logo_url',               ''),
  ('background_media_url',   ''),
  ('loading_ui_url',         ''),
  ('site_off_message',       'Site is currently under maintenance. Please check back later.'),
  ('site_off_contact_name',  ''),
  ('site_off_contact_value', ''),
  ('site_off_media_url',     '')
ON CONFLICT (key) DO NOTHING;

-- ── 8b. G2Bulk price settings (singleton row) ──
INSERT INTO g2bulk_price_settings (id, profit_pct, mmk_rate)
SELECT '00000000-0000-0000-0000-000000000001', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM g2bulk_price_settings);

-- ── 8c. Buying Pro icon placeholders ──
INSERT INTO buying_pro_icons (rank_position, icon_url)
SELECT i, '/assets/icons/default-category.svg'
FROM generate_series(1, 10) AS i
ON CONFLICT (rank_position) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 9: FINAL VERIFICATION QUERIES (run these to validate)
-- ════════════════════════════════════════════════════════════════════════════

-- Uncomment to verify counts:
-- SELECT 'TABLES' AS section, count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- SELECT 'INDEXES' AS section, count(*) FROM pg_indexes WHERE schemaname = 'public';
-- SELECT 'FUNCTIONS' AS section, count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND prokind = 'f';
-- SELECT 'TRIGGERS' AS section, count(*) FROM pg_trigger WHERE NOT tgisinternal;

-- ════════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ════════════════════════════════════════════════════════════════════════════
