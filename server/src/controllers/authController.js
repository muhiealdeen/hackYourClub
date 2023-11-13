import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import UserV3 from "../models/UserV3.js";
import VerificationToken from "../models/VerificationToken.js";
import sendEmail from "../util/sendEmail.js";
import crypto from "crypto";

// Function to generate a new verification token
const generateVerificationToken = (userId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);
  const verificationToken = new VerificationToken({
    userId,
    token,
    expiresAt,
  });
  return verificationToken.save();
};

// Function to create an HTML verification template
const createVerificationHtmlTemplate = (link) => {
  return `
    <div>
      <p>Click on the link below to verify your email. </p>
      <a href="${link}">Verify</a>
    </div>`;
};
// Function to hash the password
const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Function to send verification email
const sendVerificationEmail = async (user) => {
  // Generate a new verification token
  const savedVerificationToken = await generateVerificationToken(user._id);
  // Create the verification link
  const link = `http://localhost:8080/${user._id}/verify/${savedVerificationToken.token}`;
  // Create the HTML template
  const htmlTemplate = createVerificationHtmlTemplate(link);
  // Send the email
  await sendEmail(user.email, "Verify Your Email", htmlTemplate);
};

export const signup = async (req, res) => {
  try {
    const existingUser = await UserV3.findOne({ email: req.body.email });

    if (existingUser) {
      if (existingUser.isActive) {
        return res
          .status(400)
          .json({ success: true, result: "User already exists!" });
      } else {
        existingUser.isAccountVerified = false;
        existingUser.isActive = false;
        existingUser.password = hashPassword(req.body.password);
        (existingUser.firstName = req.body.firstName),
          (existingUser.lastName = req.body.lastName),
          (existingUser.dateOfBirth = req.body.dateOfBirth),
          (existingUser.profileImage = req.body.profileImage),
          await existingUser.save();

        // Send verification email
        await sendVerificationEmail(existingUser);

        return res.status(200).json({
          success: true,
          result: {
            message: "Account reactivated. Check your email for verification.",
          },
        });
      }
    } else {
      const newUser = new UserV3({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        email: req.body.email,
        password: hashPassword(req.body.password),
        profileImage: req.body.profileImage,
        isActive: false,
      });
      const user = await newUser.save();
      // Send verification email
      await sendVerificationEmail(user);

      return res.status(201).json({
        success: true,
        result: {
          message:
            "User registered successfully. Check your email for verification.",
        },
      });
    }
  } catch (err) {
    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ success: true, result: "Internal server error" });
  }
};

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
      user.isActive = false;
      // await user.remove();
      await verificationToken.remove();
      return res.status(400).json({
        message: "The verification link is expired.",
      });
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserV3.findOne({ email })
      .populate("favoriteClubs")
      .populate("favoriteActivities")
      .select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: true, result: "Incorrect credentials!" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: true, result: "Incorrect credentials!" });
    }

    if (!user.isAccountVerified) {
      return res.status(401).json({
        success: true,
        result: "Reactivate yous account.",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({ success: true, result: { token, user } });
  } catch (err) {
    res.status(500).json({ success: true, result: "Internal server error" });
  }
};

export const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: true,
      result: "You are not logged in! Please login first.",
    });
  }

  checkIfTokenExpired(token);

  const verifyJwt = promisify(jwt.verify);

  const decoded = await verifyJwt(token, process.env.JWT_SECRET);

  const currentUser = await UserV3.findById(decoded.id);
  if (!currentUser) {
    return res.status(401).json({
      success: true,
      result: "The user no longer exists!",
    });
  }

  req.user = currentUser;
  next();
};

const checkIfTokenExpired = (token) => {
  const decodedToken = jwt.decode(token);

  if (decodedToken && decodedToken.exp) {
    const expirationTimeInSeconds = decodedToken.exp;
    const currentUnixTime = Math.floor(Date.now() / 1000);

    if (currentUnixTime < expirationTimeInSeconds) {
      console.log("Token is still valid.");
      const timeUntilExpiration = expirationTimeInSeconds - currentUnixTime;
      console.log(`Token will expire in ${timeUntilExpiration} seconds.`);
    } else {
      console.log("Token has expired.");
    }
  } else {
    console.error(
      "Token could not be decoded or does not contain an expiration time."
    );
  }
};

export const verifyToken = async (token) => {
  if (!token) {
    return null;
  }

  if (!checkTokenNotExpired(token)) {
    console.log("checkTokenNotExpired");
    return null;
  }

  const verifyJwt = promisify(jwt.verify);

  const decoded = await verifyJwt(token, process.env.JWT_SECRET);

  const currentUser = await UserV3.findById(decoded.id);

  if (!currentUser) {
    console.log("not currentUser");
    return null;
  }

  console.log("token verified.");
  return decoded.id;
};

const checkTokenNotExpired = (token) => {
  const decodedToken = jwt.decode(token);

  if (decodedToken && decodedToken.exp) {
    const expirationTimeInSeconds = decodedToken.exp;
    const currentUnixTime = Math.floor(Date.now() / 1000);

    if (currentUnixTime < expirationTimeInSeconds) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};
