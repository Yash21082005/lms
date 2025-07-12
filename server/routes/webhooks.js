import express from 'express';
import { handleRazorpayWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Razorpay sends raw body, not JSON
router.post(
  '/razorpay/webhook',
  express.raw({ type: 'application/json' }),
  handleRazorpayWebhook
);

export default router;
