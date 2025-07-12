import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';
import bodyParser from 'body-parser';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import webhookRoutes from './routes/webhooks.js'

const app = express();

// Connect to MongoDB
await connectDB();
await connectCloudinary()
// Middleware
app.use(cors());
app.use(clerkMiddleware());

// ✅ Clerk requires raw body for signature verification
app.post('/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
app.use('/api/educator',express.json(),educatorRouter);
app.use('/api/course', express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter)
app.use('/api', webhookRoutes);
app.use(express.json());


// Test route
app.get('/', (req, res) => res.send('API Working'));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
