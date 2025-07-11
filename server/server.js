import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';
import bodyParser from 'body-parser';

const app = express();

// Connect to MongoDB
await connectDB();

// Middleware
app.use(cors());

// ✅ Clerk requires raw body for signature verification
app.post('/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);

// Test route
app.get('/', (req, res) => res.send('API Working'));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
