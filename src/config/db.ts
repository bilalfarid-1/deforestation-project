import { Sequelize } from 'sequelize';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqliteStorage = process.env.DB_STORAGE 
  ? path.resolve(process.cwd(), process.env.DB_STORAGE) 
  : path.resolve(dataDir, 'greenguard.sqlite');

const requestedDialect = (process.env.DB_DIALECT || 'sqlite').toLowerCase();

if (requestedDialect === 'postgres') {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'green-guard',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 10000,
        idle: 10000
      }
    }
  );
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false
  });
}

export async function connectWithFallback(): Promise<Sequelize> {
  try {
    await sequelize.authenticate();
    const dialectName = sequelize.getDialect();
    console.log(`[Database] Connected successfully using dialect: ${dialectName.toUpperCase()}`);
    return sequelize;
  } catch (error: any) {
    if (requestedDialect === 'postgres') {
      console.warn(`[Database] PostgreSQL connection failed (${error.message}). Falling back to embedded SQLite database...`);
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: sqliteStorage,
        logging: false
      });
      await sequelize.authenticate();
      console.log(`[Database] Resilient fallback to SQLite succeeded. Database stored at: ${sqliteStorage}`);
      return sequelize;
    }
    throw error;
  }
}

export default sequelize;
