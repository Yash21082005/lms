import crypto from 'crypto';
import { Purchase } from '../models/Purchase.js';

export const handleRazorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString('utf8');

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSignature === signature) {
    const event = JSON.parse(body);
    const payment = event.payload.payment.entity;

    if (event.event === 'payment.captured') {
      console.log('✅ Payment Captured:', payment.id);

      await Purchase.findOneAndUpdate(
        { razorpay_order_id: payment.order_id },
        {
          status: 'paid',
          razorpay_payment_id: payment.id,
        }
      );

      return res.status(200).json({ success: true });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }
};
