import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { asc } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const [rows] = await connection.execute(
  'SELECT id, firstName, lastName, department, jobRole, pin, isKeyEmployee, status FROM staff ORDER BY department, lastName'
);

console.log(JSON.stringify(rows, null, 2));
await connection.end();
process.exit(0);
