import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function getDbConn() {
  return open({
    filename: './data.db',
    driver: sqlite3.Database,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dbConn = await getDbConn();
  await dbConn.run(`
    CREATE TABLE IF NOT EXISTS instances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      ip TEXT
    )
  `);

  if (req.method === 'GET') {
    const allInstances = await dbConn.all('SELECT * FROM instances');
    return res.status(200).json(allInstances);
  }

  if (req.method === 'POST') {
    const { name, ip } = req.body;
    const result = await dbConn.run('INSERT INTO instances (name, ip) VALUES (?, ?)', name, ip);
    return res.status(201).json({ id: result.lastID, name, ip });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    await dbConn.run('DELETE FROM instances WHERE id = ?', id);
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
