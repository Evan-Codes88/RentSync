import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json());


app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the Express backend!' });
});
app.use('/api/users', userRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});