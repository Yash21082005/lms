import { Webhook } from "svix";
import crypto from "crypto";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js"; 

// 🔹 Clerk Webhook Handler
export const clerkWebhooks = async (req, res) => {
  console.log("🔔 Clerk Webhook called");

  try {
    const payload = req.body.toString(); // Raw buffer to string
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers); // Parses JSON

    const { data, type } = evt;

    console.log("📦 Event received:", type);
    console.log("🧑 Data:", data);

    if (type === "user.created") {
      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        imageUrl: data.image_url
      };

      console.log("💾 Saving user:", userData);
      await User.create(userData);
      console.log("✅ User saved successfully");
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error in Clerk webhook:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Razorpay Webhook Handler
export const razorpayWebhooks = async (req, res) => {
  console.log("🔔 Razorpay Webhook called");

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = req.body;

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        const purchaseData = await Purchase.findOne({ razorpay_order_id: orderId });
        if (!purchaseData) {
          return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId);

        if (!userData || !courseData) {
          return res.status(404).json({ success: false, message: "User or Course not found" });
        }

        userData.enrolledCourses.push(courseData._id);
        await userData.save();

        purchaseData.status = "completed";
        purchaseData.razorpay_payment_id = payment.id;
        await purchaseData.save();

        console.log("✅ Payment captured and course enrolled.");
        break;
      }

      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        const purchaseData = await Purchase.findOne({ razorpay_order_id: orderId });
        if (purchaseData) {
          purchaseData.status = "failed";
          await purchaseData.save();
        }

        console.log("❌ Payment failed.");
        break;
      }

      default:
        console.log(`ℹ️ Unhandled Razorpay event: ${event.event}`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error in Razorpay webhook:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

