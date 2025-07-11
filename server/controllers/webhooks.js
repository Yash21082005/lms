import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  console.log("🔔 Webhook called");

  try {
    const payload = req.body.toString(); // Raw buffer to string
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    };

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const evt = wh.verify(payload, headers); // parses JSON

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
    console.error("❌ Error in webhook:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

