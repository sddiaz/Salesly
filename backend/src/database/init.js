const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/sdr_system.db');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Database schema
const SCHEMA = {
  leads: `
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      company TEXT,
      title TEXT,
      industry TEXT,
      company_size TEXT,
      phone TEXT,
      linkedin_url TEXT,
      website TEXT,
      status TEXT DEFAULT 'new',
      score INTEGER DEFAULT 0,
      scoring_criteria TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  activities: `
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `,
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'email', 'linkedin', 'call_script'
      subject TEXT,
      content TEXT NOT NULL,
      personalization_data TEXT,
      grok_prompt TEXT,
      sent_at DATETIME,
      response_received BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `,
  scoring_criteria: `
    CREATE TABLE IF NOT EXISTS scoring_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      weight REAL DEFAULT 1.0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  conversations: `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      context TEXT,
      model_used TEXT,
      tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `,
  general_conversations: `
    CREATE TABLE IF NOT EXISTS general_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      context TEXT,
      model_used TEXT,
      tokens_used INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  outreach_sequences: `
    CREATE TABLE IF NOT EXISTS outreach_sequences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      sequence_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      current_step INTEGER DEFAULT 1,
      total_steps INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `,
  outreach_steps: `
    CREATE TABLE IF NOT EXISTS outreach_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sequence_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      type TEXT NOT NULL,
      template TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      completed_at DATETIME,
      result_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sequence_id) REFERENCES outreach_sequences (id) ON DELETE CASCADE
    )
  `,
  lead_research: `
    CREATE TABLE IF NOT EXISTS lead_research (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      research_data TEXT,
      pain_points TEXT,
      decision_process TEXT,
      outreach_strategy TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `,
  pipeline_stages: `
    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER NOT NULL,
      color TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  lead_stage_history: `
    CREATE TABLE IF NOT EXISTS lead_stage_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      from_stage TEXT,
      to_stage TEXT NOT NULL,
      changed_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    )
  `
};

// Default scoring criteria
const DEFAULT_SCORING_CRITERIA = [
  { name: 'Company Size', description: 'Larger companies get higher scores', weight: 1.5 },
  { name: 'Industry Match', description: 'Target industry alignment', weight: 2.0 },
  { name: 'Title Relevance', description: 'Decision-maker potential', weight: 1.8 },
  { name: 'LinkedIn Activity', description: 'Professional engagement level', weight: 1.2 },
  { name: 'Website Quality', description: 'Company maturity indicator', weight: 1.0 }
];

// Default pipeline stages
const DEFAULT_PIPELINE_STAGES = [
  { name: 'new', description: 'New leads to be contacted', order_index: 1, color: '#3B82F6' },
  { name: 'contacted', description: 'Initial contact made', order_index: 2, color: '#8B5CF6' },
  { name: 'qualified', description: 'Lead has been qualified', order_index: 3, color: '#06B6D4' },
  { name: 'proposal', description: 'Proposal sent', order_index: 4, color: '#F59E0B' },
  { name: 'negotiation', description: 'In negotiation phase', order_index: 5, color: '#EF4444' },
  { name: 'won', description: 'Deal closed successfully', order_index: 6, color: '#10B981' },
  { name: 'lost', description: 'Deal lost', order_index: 7, color: '#6B7280' }
];

let db = null;

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      ensureDataDirectory();
      
      db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err.message);
          reject(err);
          return;
        }
        
        console.log(`✅ Connected to SQLite database at ${DB_PATH}`);
        
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            console.error('❌ Failed to enable foreign keys:', err.message);
            reject(err);
            return;
          }
          
          // Create tables
          const tableNames = Object.keys(SCHEMA);
          let completed = 0;
          
          tableNames.forEach((tableName) => {
            db.run(SCHEMA[tableName], (err) => {
              if (err) {
                console.error(`❌ Failed to create table ${tableName}:`, err.message);
                reject(err);
                return;
              }
              
              completed++;
              console.log(`✅ Table ${tableName} ready`);
              
              if (completed === tableNames.length) {
                // Insert default data
                Promise.all([
                  insertDefaultScoringCriteria(),
                  insertDefaultPipelineStages()
                ])
                  .then(() => {
                    console.log('🗄️ Database initialization complete');
                    resolve();
                  })
                  .catch(reject);
              }
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function insertDefaultScoringCriteria() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO scoring_criteria (name, description, weight)
      VALUES (?, ?, ?)
    `);
    
    let completed = 0;
    DEFAULT_SCORING_CRITERIA.forEach((criteria) => {
      stmt.run([criteria.name, criteria.description, criteria.weight], (err) => {
        if (err) {
          console.error('❌ Failed to insert scoring criteria:', err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === DEFAULT_SCORING_CRITERIA.length) {
          stmt.finalize();
          console.log('✅ Default scoring criteria inserted');
          resolve();
        }
      });
    });
  });
}

async function insertDefaultPipelineStages() {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO pipeline_stages (name, description, order_index, color)
      VALUES (?, ?, ?, ?)
    `);
    
    let completed = 0;
    DEFAULT_PIPELINE_STAGES.forEach((stage) => {
      stmt.run([stage.name, stage.description, stage.order_index, stage.color], (err) => {
        if (err) {
          console.error('❌ Failed to insert pipeline stage:', err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === DEFAULT_PIPELINE_STAGES.length) {
          stmt.finalize();
          console.log('✅ Default pipeline stages inserted');
          resolve();
        }
      });
    });
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('❌ Database close error:', err.message);
      } else {
        console.log('👋 Database connection closed');
      }
    });
    db = null;
  }
}

// Database query helpers
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getDatabase,
  runQuery,
  getQuery,
  allQuery,
  DB_PATH
};
