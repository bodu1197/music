-- ============================================
-- 1. Users
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,

  -- Settings
  language TEXT DEFAULT 'en',
  country TEXT DEFAULT 'US',
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',

  -- Points/Level
  points INT DEFAULT 0,
  level TEXT DEFAULT 'newbie',

  -- Stats
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Artists (Virtual)
-- ============================================
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT UNIQUE NOT NULL,

  -- Basic Info
  name TEXT NOT NULL,
  name_i18n JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  banner_url TEXT,
  description TEXT,
  description_i18n JSONB DEFAULT '{}',
  subscribers TEXT,

  -- Fan Cafe
  slug TEXT UNIQUE,
  theme JSONB DEFAULT '{}',

  -- Stats
  platform_followers INT DEFAULT 0,
  total_posts INT DEFAULT 0,
  total_views BIGINT DEFAULT 0,

  -- Cache
  cached_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Cache (ytmusicapi)
-- ============================================
CREATE TABLE cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  key TEXT NOT NULL,
  data JSONB NOT NULL,

  language TEXT DEFAULT 'en',
  country TEXT DEFAULT 'ZZ',

  hit_count INT DEFAULT 1,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  UNIQUE(type, key, language, country)
);

-- Indices for Cache
CREATE INDEX idx_cache_lookup ON cache(type, key, language, country);
CREATE INDEX idx_cache_expiry ON cache(expires_at);
CREATE INDEX idx_cache_hits ON cache(hit_count DESC);

-- ============================================
-- 4. Posts
-- ============================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id),

  -- Content
  type TEXT NOT NULL, -- 'image', 'video', 'text', 'music', 'review'
  content TEXT,
  content_i18n JSONB DEFAULT '{}',
  media_urls TEXT[],

  -- Music Link
  music_type TEXT,
  music_id TEXT,
  music_data JSONB,

  -- Review
  rating DECIMAL(2,1),

  -- Meta
  language TEXT,
  hashtags TEXT[],
  mentions UUID[],

  -- Stats
  views_count BIGINT DEFAULT 0,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  saves_count INT DEFAULT 0,

  -- Status
  is_pinned BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. Interactions
-- ============================================
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,

  type TEXT NOT NULL, -- 'like', 'comment', 'save', 'share', 'repost'
  content TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. Follows
-- ============================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,

  following_type TEXT NOT NULL, -- 'user', 'artist'
  following_id TEXT NOT NULL,

  notifications BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_type, following_id)
);

-- ============================================
-- 7. Playlists
-- ============================================
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  title_i18n JSONB DEFAULT '{}',
  description TEXT,
  cover_url TEXT,

  is_public BOOLEAN DEFAULT FALSE,

  songs JSONB DEFAULT '[]',
  songs_count INT DEFAULT 0,

  plays_count INT DEFAULT 0,
  likes_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. Shops
-- ============================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  name_i18n JSONB DEFAULT '{}',
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  description_i18n JSONB DEFAULT '{}',

  logo_url TEXT,
  banner_url TEXT,

  -- Settings
  default_currency TEXT DEFAULT 'USD',
  supported_currencies TEXT[] DEFAULT ARRAY['USD'],
  shipping_countries TEXT[],

  -- Linked Artists
  artist_ids UUID[],

  -- Category
  category TEXT,

  -- Stats
  products_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  rating DECIMAL(2,1),
  reviews_count INT DEFAULT 0,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. Products
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  title_i18n JSONB DEFAULT '{}',
  description TEXT,
  description_i18n JSONB DEFAULT '{}',

  images TEXT[],
  video_url TEXT,

  -- Pricing
  prices JSONB NOT NULL,
  compare_prices JSONB,

  -- Options
  variants JSONB,

  -- Stock
  stock INT DEFAULT 0,
  sku TEXT,

  -- Shipping
  weight DECIMAL(10,2),
  shipping_options JSONB,

  -- Relations
  artist_id UUID REFERENCES artists(id),
  category TEXT,
  tags TEXT[],

  -- Stats
  views_count INT DEFAULT 0,
  sales_count INT DEFAULT 0,
  rating DECIMAL(2,1),
  reviews_count INT DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'active',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. Orders
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,

  user_id UUID REFERENCES users(id),
  shop_id UUID REFERENCES shops(id),

  -- Items
  items JSONB NOT NULL,

  -- Totals
  subtotal DECIMAL(15,2) NOT NULL,
  shipping_fee DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Info
  shipping_address JSONB,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
