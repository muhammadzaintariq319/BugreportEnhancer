import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { settingsRouter } from './routes/settings';
import { analyzeRouter } from './routes/analyze';
import { testConnectionRouter } from './routes/testConnection';

const app = express();
const PORT = 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/settings', settingsRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/test', testConnectionRouter);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`🚀 Bug Report Enhancer server running on http://localhost:${PORT}`);
});
