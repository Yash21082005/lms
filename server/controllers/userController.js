import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Razorpay from "razorpay";
import Course from "../models/Course.js";
import crypto from "crypto";

// 🔹 Get User Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 🔹 Get User's Enrolled Courses
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userData = await User.findById(userId).populate("enrolledCourses");

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// 🔹 Purchase Course - Razorpay Order Creation
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;

    const userData = await User.findById(userId);
    const courseData = await Course.findById(courseId);

    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    // Prevent duplicate purchase
    const existingPurchase = await Purchase.findOne({ userId, courseId });
    if (existingPurchase) {
      return res.json({
        success: false,
        message: "Course already purchased",
      });
    }

    const amount = (
      courseData.coursePrice -
      (courseData.discount * courseData.coursePrice) / 100
    ).toFixed(2);

    const newPurchase = await Purchase.create({
      courseId: courseData._id,
      userId,
      amount,
      status: "pending",
    });

    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpayInstance.orders.create({
      amount: Math.floor(amount * 100), // in paise
      currency: "INR",
      receipt: `receipt_${newPurchase._id}`,
      notes: {
        purchaseId: newPurchase._id.toString(),
      },
    });

    // Update purchase with order id
    newPurchase.razorpay_order_id = order.id;
    await newPurchase.save();

    // Send details to frontend to load Razorpay Checkout
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      courseTitle: courseData.courseTitle,
      userName: userData.name,
      userEmail: userData.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      const purchase = await Purchase.findOneAndUpdate(
        { razorpay_order_id },
        {
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
        },
        { new: true }
      );

      await User.findByIdAndUpdate(purchase.userId, {
        $addToSet: { enrolledCourses: purchase.courseId },
      });

      return res.json({
        success: true,
        message: "✅ Payment verified and course enrolled successfully",
      });
    } else {
      return res.status(400).json({ success: false, message: "❌ Invalid signature" });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
