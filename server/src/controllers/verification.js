import UserV3 from "../models/UserV3.js";
import VerificationToken from "../models/VerificationToken.js";

export const verification = async (req, res) => {
  try {
    const user = await UserV3.findOne({ _id: req.params.userId });

    if (!user) {
      return res.status(400).json({ message: "Invalid link." });
    }

    const verificationToken = await VerificationToken.findOne({
      userId: user._id,
      token: req.params.token,
    });
    console.log("verificationTokenVVVVVVV", verificationToken);

    if (!verificationToken) {
      return res.status(400).json({ message: "Invalid link." });
    }
    if (verificationToken.expiresAt < new Date()) {
      await user.isActive;
      false;
      await verificationToken.remove();
      return res.status(400).json({ message: "Invalid link." });
    }
    user.isAccountVerified = true;
    user.isActive = true;
    await user.save();
    await verificationToken.remove();

    res.status(200).json({ success: true, result: "Your account is verified" });
  } catch (error) {
    console.error("Verification error:", error);
    return res
      .status(500)
      .json({ success: false, result: "Internal server error" });
  }
};
