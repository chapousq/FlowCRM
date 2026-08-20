const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        plan TEXT DEFAULT 'free',
        role TEXT DEFAULT 'user',
        company_name TEXT DEFAULT '',
        banned INTEGER DEFAULT 0,
        banned_reason TEXT DEFAULT '',
        login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMPTZ,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        company TEXT DEFAULT '',
        role TEXT DEFAULT '',
        status TEXT DEFAULT 'lead',
        value REAL DEFAULT 0,
        score INTEGER DEFAULT 0,
        last_contact TIMESTAMPTZ,
        source TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        color TEXT DEFAULT '#4f46e5'
      );

      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (contact_id, tag_id)
      );

      CREATE TABLE IF NOT EXISTS deals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER REFERENCES contacts(id),
        title TEXT NOT NULL,
        value REAL DEFAULT 0,
        stage TEXT DEFAULT 'lead',
        probability INTEGER DEFAULT 10,
        expected_close DATE,
        notes TEXT DEFAULT '',
        loss_reason TEXT DEFAULT '',
        closed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deal_history (
        id SERIAL PRIMARY KEY,
        deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        old_stage TEXT,
        new_stage TEXT NOT NULL,
        changed_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        contact_id INTEGER REFERENCES contacts(id),
        deal_id INTEGER REFERENCES deals(id),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        due_date TIMESTAMPTZ,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT DEFAULT 'geral',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS automations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        trigger_value TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_value TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        plan TEXT NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'BRL',
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'credit_card',
        card_last4 TEXT DEFAULT '',
        card_name TEXT DEFAULT '',
        billing_email TEXT DEFAULT '',
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Banco de dados inicializado');
  } finally {
    client.release();
  }
}

async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result;
}

module.exports = { pool, query, initDB };
