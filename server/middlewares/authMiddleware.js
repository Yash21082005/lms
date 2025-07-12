import { clerkClient } from "@clerk/express";

// Middleware to protect educator routes
export const protectEducator = async (req, res, next) => {
  try {
    console.log("protectEducator => req.auth:", req.auth); // 🔍 Debug log

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID found' });
    }

    const user = await clerkClient.users.getUser(userId);
    const role = user.publicMetadata?.role;

    if (role !== 'educator') {
      return res.status(403).json({ success: false, message: 'Forbidden: Educator access only' });
    }

    next(); // ✅ All good, continue

  } catch (error) {
    console.error("protectEducator error:", error); // 💥 Debug error
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
