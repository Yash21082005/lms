import express from 'express';
import {
  getUserData,
  purchaseCourse,
  userEnrolledCourses,
  verifyPayment // ✅ import verifyPayment function
} from '../controllers/userController.js';

import { requireAuth } from '@clerk/express';

const userRouter = express.Router();

// ✅ Protected Routes
userRouter.get('/data', requireAuth(), getUserData);
userRouter.get('/enrolled-courses', requireAuth(), userEnrolledCourses);

// ✅ Purchase & Payment
userRouter.post('/purchase', requireAuth(), purchaseCourse);
userRouter.post('/verify-payment', requireAuth(), verifyPayment); // ✅ Added route

export default userRouter;

