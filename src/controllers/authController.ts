import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, PendingUser } from '../models/index.js';
import { sendMailSafely } from '../config/mail.js';

// Password Strength Validator
export const validatePassword = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return hasUpperCase && hasNumber && hasSpecial;
};

// Sign Up Handler
export const signUp = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, organization } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert into PendingUser
    const pending = await PendingUser.findOne({ where: { email: normalizedEmail } });
    if (pending) {
      pending.name = name ? name.trim() : 'Analyst';
      pending.password_hash = hashedPassword;
      pending.organization = organization ? organization.trim() : '';
      pending.otp = otp;
      pending.otpExpires = otpExpires;
      await pending.save();
    } else {
      await PendingUser.create({
        name: name ? name.trim() : 'Analyst',
        email: normalizedEmail,
        password_hash: hashedPassword,
        organization: organization ? organization.trim() : '',
        otp,
        otpExpires
      });
    }

    // Send OTP Email
    await sendMailSafely({
      from: `"GreenGuard Security" <${process.env.EMAIL_USER || 'greenguard.satellite@gmail.com'}>`,
      to: normalizedEmail,
      subject: 'GreenGuard - Registration Verification Code',
      text: `Welcome to GreenGuard! Your 6-digit verification code is: ${otp}. This code expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; color: #1e293b; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; margin: 0 auto;">
          <h2 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-top: 0;">🌲 GreenGuard Identity Verification</h2>
          <p>Thank you for signing up for GreenGuard Forest Monitoring. Please enter the following 6-digit code to complete your registration:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 24px; border-radius: 12px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b;">Code expires in 15 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email address.',
      email: normalizedEmail
    });
  } catch (error: any) {
    console.error('[Auth API] SignUp Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

// Verify OTP Handler
export const verifyOTP = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const pending = await PendingUser.findOne({ where: { email: normalizedEmail } });

    if (!pending) {
      return res.status(400).json({ error: 'Invalid or expired signup session.' });
    }

    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (new Date(pending.otpExpires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign up again.' });
    }

    // Create User
    const newUser = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password_hash,
      organization: pending.organization,
      isVerified: true
    });

    await PendingUser.destroy({ where: { email: normalizedEmail } });

    // Issue JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_SECRET || 'greenguard_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account verified successfully.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error: any) {
    console.error('[Auth API] VerifyOTP Error:', error);
    return res.status(500).json({ error: 'Internal server error during OTP verification.' });
  }
};

// Sign In Handler
export const signIn = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'greenguard_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error: any) {
    console.error('[Auth API] SignIn Error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};

// Forgot Password Handler
export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(400).json({ error: 'No account with this email address exists.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendMailSafely({
      from: `"GreenGuard Security" <${process.env.EMAIL_USER || 'greenguard.satellite@gmail.com'}>`,
      to: normalizedEmail,
      subject: 'GreenGuard - Password Reset Verification Code',
      text: `Your password reset code is: ${otp}. This code expires in 15 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; color: #1e293b; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; margin: 0 auto;">
          <h2 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-top: 0;">🌲 GreenGuard Password Reset</h2>
          <p>Please enter the following 6-digit code to reset your password:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px 24px; border-radius: 12px; display: inline-block;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 13px; color: #64748b;">Code expires in 15 minutes.</p>
        </div>
      `
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email address.'
    });
  } catch (error: any) {
    console.error('[Auth API] Forgot Password Error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset request.' });
  }
};

// Reset Password Handler
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required.' });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid password reset request.' });
    }

    if (!user.resetOTP || user.resetOTP !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    if (user.resetOTPExpires && new Date(user.resetOTPExpires) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOTP = null;
    user.resetOTPExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in.'
    });
  } catch (error: any) {
    console.error('[Auth API] Reset Password Error:', error);
    return res.status(500).json({ error: 'Internal server error during password reset.' });
  }
};
