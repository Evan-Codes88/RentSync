import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './utils/connectDB.js';

import userRoutes from './routes/userRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});