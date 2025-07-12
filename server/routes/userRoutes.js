import express from 'express';
import {
    addUserRating,
    getUserCourseProgress,
  getUserData,
  purchaseCourse,
  updateUserCourseProgress,
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

userRouter.post('/update-course-progress', updateUserCourseProgress);
userRouter.post('/get-course-progress', getUserCourseProgress);
userRouter.post('/add-rating', addUserRating)

export default userRouter;

