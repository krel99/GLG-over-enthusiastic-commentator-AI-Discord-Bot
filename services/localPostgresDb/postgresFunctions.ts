// bun services/databaseUtilities.ts
// ! postgress server needs to be running for this to work
// sudo systemctl start postgresql@14-main
// sudo systemctl stop postgresql@14-main
// sudo systemctl restart postgresql@14-main
// sudo systemctl status postgresql@14-main

import { Pool } from "pg";
import colors from "colors";
colors.enable();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "scraping",
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

const SQL_createDocumentsTable = `
CREATE TABLE IF NOT EXISTS mytable (
  id SERIAL PRIMARY KEY,
  article_title VARCHAR(255),
  article_body TEXT,
  article_url VARCHAR(255),
  scraped_date TIMESTAMP DEFAULT NOW()
);`;

const SQL_populateDocumentsRow = `
INSERT INTO tableName (article_title, article_body, article_url)
VALUES ($1, $2, $3);
`;

const SQL_retrieveAllRows = `
SELECT * FROM mytable;
`;

export async function createTable(tableName: string) {
  const client = await pool.connect();
  try {
    const SQL_QUERY = SQL_createDocumentsTable.replace("mytable", tableName);
    await client.query(SQL_QUERY);
    console.log("Table created successfully.".green);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
}

export async function insertData(table_name: string, article_url: string, article_title?: string, article_body?: string) {
  const client = await pool.connect();
  try {
    await client.query(SQL_populateDocumentsRow.replace("tableName", table_name), [article_title, article_body, article_url]);
    console.log("Row added to the table successfully.".green);
  } catch (err: any) {
    console.error(err.message);
  } finally {
    client.release();
  }
}

export async function retrieveAllRows(table_name: string) {
  const client = await pool.connect();
  try {
    const SQL_QUERY = SQL_retrieveAllRows.replace("mytable", table_name);
    const data = await client.query(SQL_QUERY);
    // data.rows.forEach((row) => console.log(row.article_title));
    return data;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
}

const SQL_createFeedbackTable = `
CREATE TABLE IF NOT EXISTS mytable (
  id SERIAL PRIMARY KEY,
  question TEXT,
  context TEXT,
  answer TEXT,
  text_rating VARCHAR(10),
  feedback_date TIMESTAMP DEFAULT NOW()
);`;

const SQL_populateFeedbackRow = `
INSERT INTO tableName (question, context,text_rating, answer)
VALUES ($1, $2, $3, $4);
`;

export async function createFeedbackTable(tableName: string) {
  const client = await pool.connect();
  try {
    const SQL_QUERY = SQL_createFeedbackTable.replace("mytable", tableName);
    await client.query(SQL_QUERY);
    console.log("Table created successfully.".green);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
}

export async function insertFeedbackData(table_name: string, question: string, context: string, answer: string, rating: string) {
  const client = await pool.connect();
  try {
    await client.query(SQL_populateFeedbackRow.replace("tableName", table_name), [question, context, rating, answer]);
    console.log("Row added to the table successfully.".green);
  } catch (err: any) {
    console.error(err.message);
  } finally {
    client.release();
  }
}
