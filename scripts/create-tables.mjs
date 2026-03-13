import pg from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = `
-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'organizer', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE game_status AS ENUM ('draft', 'open', 'active', 'done', 'archive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pitch_status AS ENUM ('waiting', 'active', 'done');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pitch_session_status AS ENUM ('pending', 'active', 'paused', 'done');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('bank_in', 'bank_out', 'transfer', 'refund');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE certificate_status AS ENUM ('active', 'activated', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  about TEXT,
  role user_role NOT NULL DEFAULT 'user',
  tariff_id UUID,
  tariff_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tariffs
CREATE TABLE IF NOT EXISTS tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_days INT,
  price_rub INT NOT NULL,
  original_price_rub INT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add FK after both tables exist
DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_tariff_id_fkey FOREIGN KEY (tariff_id) REFERENCES tariffs(id);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Games
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  status game_status NOT NULL DEFAULT 'draft',
  max_participants INT,
  pitch_duration_sec INT NOT NULL DEFAULT 120,
  organizer_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Game Participants
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  user_id UUID NOT NULL REFERENCES users(id),
  balance_b BIGINT NOT NULL DEFAULT 0,
  pitch_order INT,
  pitch_status pitch_status NOT NULL DEFAULT 'waiting',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount_b BIGINT NOT NULL,
  amount_rub INT,
  type transaction_type NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID UNIQUE NOT NULL REFERENCES transactions(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  game_id UUID NOT NULL REFERENCES games(id),
  service_description TEXT NOT NULL,
  amount_b BIGINT NOT NULL,
  status certificate_status NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pitch Sessions
CREATE TABLE IF NOT EXISTS pitch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID UNIQUE NOT NULL REFERENCES games(id),
  status pitch_session_status NOT NULL DEFAULT 'pending',
  current_speaker_id UUID REFERENCES game_participants(id),
  speaker_started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game ON transactions(game_id);
CREATE INDEX IF NOT EXISTS idx_certificates_game ON certificates(game_id);
CREATE INDEX IF NOT EXISTS idx_certificates_seller ON certificates(seller_id);
CREATE INDEX IF NOT EXISTS idx_certificates_buyer ON certificates(buyer_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_sessions ENABLE ROW LEVEL SECURITY;

-- Permissive policies for anon key (API routes handle auth)
DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON tariffs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON games FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON game_participants FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON certificates FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for anon" ON pitch_sessions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null;
END $$;
`;

async function main() {
  console.log("Connecting to database...");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected! Creating tables...");

  await client.query(sql);
  console.log("All tables and indexes created successfully!");

  await client.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
