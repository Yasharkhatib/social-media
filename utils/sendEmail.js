import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv6 } from "uuid";
import { hashString } from "./index.js";
import Verfication from "../models/emailVerfication.js";
import { google } from "googleapis";
import PasswordReset from "../models/PasswordReset.js";

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, AUTH_EMAIL, APP_URL } =
  process.env;

// Create OAuth2 client
const oauth2Client = new OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // Redirect URL for OAuth2
);

// Set credentials for OAuth2 client
oauth2Client.setCredentials({
  refresh_token: REFRESH_TOKEN,
});

// Send verification email using OAuth2
export const sendVerificationEmail = async (user, res) => {
  const { _id, email, lastName } = user;

  // Generate the verification token
  const token = _id + uuidv6();

  // Construct the verification link
  const link = `${APP_URL}users/verify/${_id}/${token}`;

  // Generate a new access token
  const accessToken = await oauth2Client.getAccessToken();

  // Create a Nodemailer transporter using OAuth2
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: AUTH_EMAIL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  // Email options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div style="font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #fff;">
      <h1 style="color: rgb(8, 56, 188);">Please Verify your email address</h1>
      <hr>
      <h4>Hi ${lastName},</h4>
      <p>Please verify your email address so we can know it's really you.<br>
        <p>This link <b>expires in 1 hour</b></p>
        <br>
        <a href="${link}" style="color: #fff; padding: 14px; text-decoration: none; background-color: black;">
          Verify Email Address
        </a>
      </p>
      <div style="margin-top: 20px;">
        <h5>Best Regards</h5>
        <h5>AzerFun Developer Yashar Khatib</h5>
      </div>
    </div>`,
  };

  try {
    // Hash the token for database storage
    const hashedToken = await hashString(token);

    // Save the verification token in the database
    const newVerifiedEmail = await Verfication.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // 1 hour expiry
    });

    // Send the email if the token is saved
    if (newVerifiedEmail) {
      await transporter.sendMail(mailOptions);
      res.status(201).send({
        success: "PENDING",
        message:
          "Verification email has been sent to your account. Check your email.",
      });
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      // Check if headers are already sent
      res.status(500).json({ message: "Something went wrong" });
    }
  }
};

// Send reset password email using OAuth2
export const resetPasswordLink = async (user, res) => {
  const { _id, email } = user;

  // Generate the reset password token
  const token = _id + uuidv6();

  // Construct the reset password link
  const link = `${APP_URL}users/reset-password/${_id}/${token}`;

  // Generate a new access token
  const accessToken = await oauth2Client.getAccessToken();

  // Create a Nodemailer transporter using OAuth2
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: AUTH_EMAIL,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });

  // Email options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Password Reset",
    html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;">
         Password reset link. Please click the link below to reset password.
        <br>
        <p style="font-size: 18px;"><b>This link expires in 10 minutes</b></p>
         <br>
        <a href=${link} style="color: #fff; padding: 10px; text-decoration: none; background-color: #000;  border-radius: 8px; font-size: 18px; ">Reset Password</a>.
    </p>`,
  };

  try {
    // Hash the token for database storage
    const hashedToken = await hashString(token);

    // Save the reset password token in the database
    const resetEmail = await PasswordReset.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, // 10 min
    });

    // Send the email if the token is saved
    if (resetEmail) {
      try {
        await transporter.sendMail(mailOptions);
        res.status(201).send({
          success: "PENDING",
          message: "Reset Password Link has been sent to your account",
        });
      } catch (err) {
        console.log(err);
        res.status(404).json({ message: "Something went wrong" });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
