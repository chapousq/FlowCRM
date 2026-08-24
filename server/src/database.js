const path = require('path');
const fs = require('fs');

let pool = null;
let sqliteDb = null;
let SqlJsDatabase = null;

const DB_PATH = path.join(__dirname, '..', 'crm.db');

async function initDB() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL, plan TEXT DEFAULT 'free', role TEXT DEFAULT 'user',
          company_name TEXT DEFAULT '', banned INTEGER DEFAULT 0, banned_reason TEXT DEFAULT '',
          login_attempts INTEGER DEFAULT 0, locked_until TIMESTAMPTZ,
          last_login TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL, email TEXT DEFAULT '', phone TEXT DEFAULT '',
          company TEXT DEFAULT '', role TEXT DEFAULT '', status TEXT DEFAULT 'lead',
          value REAL DEFAULT 0, score INTEGER DEFAULT 0, last_contact TIMESTAMPTZ,
          source TEXT DEFAULT '', notes TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS tags (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL, color TEXT DEFAULT '#4f46e5'
        );
        CREATE TABLE IF NOT EXISTS contact_tags (
          contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (contact_id, tag_id)
        );
        CREATE TABLE IF NOT EXISTS deals (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          contact_id INTEGER REFERENCES contacts(id), title TEXT NOT NULL,
          value REAL DEFAULT 0, stage TEXT DEFAULT 'lead', probability INTEGER DEFAULT 10,
          expected_close DATE, notes TEXT DEFAULT '', loss_reason TEXT DEFAULT '',
          closed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS deal_history (
          id SERIAL PRIMARY KEY, deal_id INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
          old_stage TEXT, new_stage TEXT NOT NULL, changed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          contact_id INTEGER REFERENCES contacts(id), deal_id INTEGER REFERENCES deals(id),
          type TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '',
          due_date TIMESTAMPTZ, completed INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS email_templates (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL,
          category TEXT DEFAULT 'geral', created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS automations (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          name TEXT NOT NULL, trigger_type TEXT NOT NULL, trigger_value TEXT NOT NULL,
          action_type TEXT NOT NULL, action_value TEXT NOT NULL, enabled INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
          plan TEXT NOT NULL, amount REAL NOT NULL, currency TEXT DEFAULT 'BRL',
          status TEXT DEFAULT 'pending', payment_method TEXT DEFAULT 'credit_card',
          card_last4 TEXT DEFAULT '', card_name TEXT DEFAULT '', billing_email TEXT DEFAULT '',
          expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('Conectado ao PostgreSQL');
    } finally {
      client.release();
    }
  } else {
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    let buffer = null;
    if (fs.existsSync(DB_PATH)) {
      buffer = fs.readFileSync(DB_PATH);
    }
    sqliteDb = buffer ? new SQL.Database(buffer) : new SQL.Database();

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, plan TEXT DEFAULT 'free', role TEXT DEFAULT 'user',
        company_name TEXT DEFAULT '', banned INTEGER DEFAULT 0, banned_reason TEXT DEFAULT '',
        login_attempts INTEGER DEFAULT 0, locked_until DATETIME,
        last_login DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL,
        email TEXT DEFAULT '', phone TEXT DEFAULT '', company TEXT DEFAULT '', role TEXT DEFAULT '',
        status TEXT DEFAULT 'lead', value REAL DEFAULT 0, score INTEGER DEFAULT 0,
        last_contact DATETIME, source TEXT DEFAULT '', notes TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
        name TEXT NOT NULL, color TEXT DEFAULT '#4f46e5', FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS contact_tags (
        contact_id INTEGER NOT NULL, tag_id INTEGER NOT NULL,
        PRIMARY KEY (contact_id, tag_id),
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, contact_id INTEGER,
        title TEXT NOT NULL, value REAL DEFAULT 0, stage TEXT DEFAULT 'lead',
        probability INTEGER DEFAULT 10, expected_close DATE, notes TEXT DEFAULT '',
        loss_reason TEXT DEFAULT '', closed_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (contact_id) REFERENCES contacts(id)
      );
      CREATE TABLE IF NOT EXISTS deal_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, deal_id INTEGER NOT NULL,
        old_stage TEXT, new_stage TEXT NOT NULL, changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, contact_id INTEGER,
        deal_id INTEGER, type TEXT NOT NULL, title TEXT NOT NULL, description TEXT DEFAULT '',
        due_date DATETIME, completed INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (contact_id) REFERENCES contacts(id),
        FOREIGN KEY (deal_id) REFERENCES deals(id)
      );
      CREATE TABLE IF NOT EXISTS email_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL,
        subject TEXT NOT NULL, body TEXT NOT NULL, category TEXT DEFAULT 'geral',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS automations (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL,
        trigger_type TEXT NOT NULL, trigger_value TEXT NOT NULL, action_type TEXT NOT NULL,
        action_value TEXT NOT NULL, enabled INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, plan TEXT NOT NULL,
        amount REAL NOT NULL, currency TEXT DEFAULT 'BRL', status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'credit_card', card_last4 TEXT DEFAULT '', card_name TEXT DEFAULT '',
        billing_email TEXT DEFAULT '', expires_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    saveDB();
    console.log('Conectado ao SQLite local');
  }
}

function saveDB() {
  if (sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

async function query(sql, params = []) {
  if (pool) {
    const lowerSql = sql.trim().toUpperCase();
    if (lowerSql.startsWith('SELECT')) {
      const result = await pool.query(sql, params);
      return { rows: result.rows };
    } else if (lowerSql.includes('RETURNING')) {
      const result = await pool.query(sql, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } else {
      const result = await pool.query(sql, params);
      return { rows: [], rowCount: result.rowCount };
    }
  } else {
    const lowerSql = sql.trim().toUpperCase();
    const isSelect = lowerSql.startsWith('SELECT');
    const isReturning = lowerSql.includes('RETURNING');

    if (isSelect) {
      const stmt = sqliteDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows };
    } else if (isReturning) {
      const stmt = sqliteDb.prepare(sql);
      stmt.bind(params);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();
      saveDB();
      return { rows: [row], rowCount: 1 };
    } else {
      sqliteDb.run(sql, params);
      const lastId = sqliteDb.exec("SELECT last_insert_rowid() as id")[0]?.values[0][0] || 0;
      const changes = sqliteDb.getRowsModified();
      saveDB();
      return { rows: [], rowCount: changes, lastInsertRowid: lastId };
    }
  }
}

module.exports = { pool, query, initDB };
