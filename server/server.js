import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import bodyParser from 'body-parser';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import webhookRoutes from './routes/webhooks.js';
import { razorpayWebhooks, clerkWebhooks } from './controllers/webhooks.js';

const app = express();

// ✅ CORS setup for localhost + production frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://lms-frontend.vercel.app' // 👈 replace with your actual frontend domain if different
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// Connect to MongoDB and Cloudinary
await connectDB();
await connectCloudinary();

// Clerk middleware
app.use(clerkMiddleware());

// Clerk webhook (must be raw)
app.post('/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);

// Routes
app.use('/api/educator', express.json(), educatorRouter);
app.use('/api/course', express.json(), courseRouter);
app.use('/api/user', express.json(), userRouter);
app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), razorpayWebhooks);

// Test route
app.get('/', (req, res) => res.send('API Working'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
