
import { Router, Request, Response } from 'express';

const express = require('express');
const app = express();
const PORT = 3030;

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello from Express and pnpm!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
