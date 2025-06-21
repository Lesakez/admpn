const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'adminpanel', 
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'adminpanel',
  multipleStatements: true
};

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function createMigrationsTable(connection) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(32)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  
  await connection.execute(createTableQuery);
  console.log('✅ Schema migrations table ready');
}

async function getExecutedMigrations(connection) {
  const [rows] = await connection.execute(
    'SELECT filename FROM schema_migrations ORDER BY executed_at'
  );
  return rows.map(row => row.filename);
}

async function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

async function runMigration(connection, filename, content) {
  const checksum = await calculateChecksum(content);
  
  try {
    console.log(`🔄 Executing migration: ${filename}`);
    
    // Выполняем миграцию
    await connection.query(content);
    
    // Записываем в таблицу миграций
    await connection.execute(
      'INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)',
      [filename, checksum]
    );
    
    console.log(`✅ Migration ${filename} executed successfully`);
  } catch (error) {
    console.error(`❌ Error executing migration ${filename}:`, error.message);
    throw error;
  }
}

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connected');
    
    await createMigrationsTable(connection);
    
    // Получаем список уже выполненных миграций
    const executedMigrations = await getExecutedMigrations(connection);
    console.log(`📋 Found ${executedMigrations.length} executed migrations`);
    
    // Проверяем существование папки миграций
    try {
      await fs.access(MIGRATIONS_DIR);
    } catch (error) {
      console.log('📁 No migrations directory found, creating empty one...');
      return;
    }
    
    // Читаем все файлы миграций
    const migrationFiles = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort(); // Сортируем по имени файла
    
    console.log(`📁 Found ${sqlFiles.length} migration files`);
    
    // Выполняем новые миграции
    let executed = 0;
    for (const filename of sqlFiles) {
      if (!executedMigrations.includes(filename)) {
        const filePath = path.join(MIGRATIONS_DIR, filename);
        const content = await fs.readFile(filePath, 'utf8');
        
        await runMigration(connection, filename, content);
        executed++;
      } else {
        console.log(`⏭️  Skipping already executed migration: ${filename}`);
      }
    }
    
    if (executed === 0) {
      console.log('✨ No new migrations to execute');
    } else {
      console.log(`🎉 Successfully executed ${executed} new migrations`);
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Запускаем миграции
runMigrations();