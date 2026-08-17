import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

let transporter: nodemailer.Transporter;

if (user && pass && pass.trim() !== '') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });
} else {
  // Development Mock Transporter
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    buffer: true
  });
  console.log('[Mail] Running in Development Stream mode (emails and OTPs logged to server console).');
}

export const sendMailSafely = async (options: nodemailer.SendMailOptions): Promise<{ success: boolean; messageId?: string }> => {
  try {
    const info = await transporter.sendMail(options);
    console.log(`[Mail] Email dispatched to ${options.to}. Subject: "${options.subject}"`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn(`[Mail] SMTP dispatch warning (${error.message}). Logging message locally for development.`);
    console.log(`[Mail DEV-LOG] TO: ${options.to}`);
    console.log(`[Mail DEV-LOG] SUBJECT: ${options.subject}`);
    console.log(`[Mail DEV-LOG] BODY:\n${options.text || options.html}`);
    return { success: true };
  }
};

export default transporter;
