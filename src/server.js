import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// File-based persistence
const dataDir = path.join(__dirname, '../data');
const dataFilePath = path.join(dataDir, 'items.json');

// In-memory store structure
const memoryStore = {
  items: new Map(), // id -> item
};

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, '[]', 'utf-8');
  }
}

async function loadFromDisk() {
  try {
    const raw = await fs.readFile(dataFilePath, 'utf-8');
    const arr = JSON.parse(raw || '[]');
    memoryStore.items.clear();
    for (const it of Array.isArray(arr) ? arr : []) {
      if (it && it.id) memoryStore.items.set(it.id, it);
    }
  } catch (err) {
    console.error('Failed to load items from disk:', err);
  }
}

async function saveToDisk() {
  const arr = Array.from(memoryStore.items.values());
  await fs.writeFile(dataFilePath, JSON.stringify(arr, null, 2), 'utf-8');
}

function validateItem(payload) {
  const name = typeof payload?.name === 'string' ? payload.name.trim() : '';
  const dish = typeof payload?.dish === 'string' ? payload.dish.trim() : '';
  const section = typeof payload?.section === 'string' ? payload.section.trim().toLowerCase() : '';
  const allowed = ['appetizers', 'entree', 'dessert', 'beverages'];
  if (!name) return { ok: false, error: 'Name is required' };
  if (!dish) return { ok: false, error: 'Dish is required' };
  if (!allowed.includes(section)) return { ok: false, error: 'Section must be one of appetizers, entree, dessert, beverages' };
  return { ok: true, value: { name, dish, section } };
}

// API Routes
app.get('/api/items', async (req, res) => {
  try {
    const items = Array.from(memoryStore.items.values());
    items.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
    return res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.post('/api/items', async (req, res) => {
  const { ok, error, value } = validateItem(req.body);
  if (!ok) return res.status(400).json({ error });
  try {
    const id = Math.random().toString(36).slice(2, 10);
    const now = Date.now();
    const item = { id, ...value, createdAt: now, updatedAt: now };
    memoryStore.items.set(id, item);
    await saveToDisk();
    return res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  const id = req.params.id;
  const { ok, error, value } = validateItem(req.body);
  if (!ok) return res.status(400).json({ error });
  try {
    if (!memoryStore.items.has(id)) return res.status(404).json({ error: 'Not found' });
    const now = Date.now();
    const updated = { ...memoryStore.items.get(id), ...value, updatedAt: now };
    memoryStore.items.set(id, updated);
    await saveToDisk();
    return res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const id = req.params.id;
  try {
    if (!memoryStore.items.has(id)) return res.status(404).json({ error: 'Not found' });
    memoryStore.items.delete(id);
    await saveToDisk();
    return res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Serve static frontend
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const port = process.env.PORT || 8080;
async function bootstrap() {
  await ensureDataFile();
  await loadFromDisk();
  app.listen(port, () => {
    console.log(`Potluck server listening on http://localhost:${port}`);
  });
}
bootstrap();


