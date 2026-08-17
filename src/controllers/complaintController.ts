import { Request, Response } from 'express';
import { sendMailSafely } from '../config/mail.js';
import { SendComplaintRequestBody } from '../types/index.js';

const RECIPIENT_EMAIL = process.env.TARGET_COMPLAINT_EMAIL || 'waniahmaryam@gmail.com';

export const sendComplaint = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { senderName, senderEmail, complaintMessage, attachedReport }: SendComplaintRequestBody = req.body;

    if (!senderName || !senderEmail || !complaintMessage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: Complainant Name, Email, or Message.',
        message: 'Missing required fields: Complainant Name, Email, or Message.'
      });
    }

    console.log(`[Complaint API] Processing complaint from ${senderName} (${senderEmail}) to ${RECIPIENT_EMAIL}...`);

    let reportText = '';
    let reportHtml = '';

    if (attachedReport) {
      reportText = `
--------------------------------------------------
ATTACHED COMPLAINT ANALYSIS REPORT:
Name: ${attachedReport.name || 'Analysis Scan'}
Date: ${attachedReport.date || new Date().toLocaleDateString()}
Region ID: ${attachedReport.regionId || 'Margalla Hills AOI'}
Status: ${attachedReport.status || 'Warning'}
Monitored Area: ${attachedReport.areaMonitored || '520.8 km²'}
Healthy Forest Canopy: ${attachedReport.forestPercentage || 94}%
Deforestation Loss: ${attachedReport.deforestedPercentage || 6}%
Summary: ${attachedReport.summary || 'Canopy variance analysis detected deforestation.'}
--------------------------------------------------
`;

      reportHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-top: 20px;">
          <h3 style="color: #065f46; margin-top: 0;">🌲 Attached Analysis Report: ${attachedReport.name || 'Analysis Scan'}</h3>
          <p><strong>Date:</strong> ${attachedReport.date} | <strong>Region:</strong> ${attachedReport.regionId || 'Margalla Hills AOI'}</p>
          <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">${attachedReport.status || 'Warning'}</span></p>
          <p><strong>Healthy Canopy:</strong> ${attachedReport.forestPercentage || 94}% | <strong>Canopy Loss:</strong> ${attachedReport.deforestedPercentage || 6}%</p>
          <p><strong>Summary:</strong> ${attachedReport.summary}</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"${senderName} via GreenGuard" <${process.env.EMAIL_USER || 'greenguard.satellite@gmail.com'}>`,
      to: RECIPIENT_EMAIL,
      replyTo: senderEmail,
      subject: `[URGENT COMPLAINT] Deforestation Alert - ${attachedReport ? attachedReport.name : 'Margalla Hills AOI'}`,
      text: `DEFORESTATION COMPLAINT NOTICE\n========================================\n\nComplainant Name: ${senderName}\nComplainant Email: ${senderEmail}\nTarget Recipient: ${RECIPIENT_EMAIL}\n\nCOMPLAINT MESSAGE:\n${complaintMessage}\n\n${reportText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; color: #1e293b; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #065f46; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-top: 0;">🌲 GreenGuard Deforestation Complaint System</h2>
          <p><strong>Complainant Name:</strong> ${senderName}</p>
          <p><strong>Complainant Email:</strong> <a href="mailto:${senderEmail}">${senderEmail}</a></p>
          <p><strong>Target Recipient Authority:</strong> <strong>${RECIPIENT_EMAIL}</strong></p>
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <h4 style="margin-top: 0; color: #b45309;">Official Complaint Message:</h4>
            <p style="white-space: pre-line; margin-bottom: 0;">${complaintMessage}</p>
          </div>
          
          ${reportHtml}

          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            Sent automatically via GreenGuard Satellite Forest Monitoring Complaint API
          </div>
        </div>
      `
    };

    const dispatchResult = await sendMailSafely(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Email delivered successfully",
      details: dispatchResult
    });

  } catch (error: any) {
    console.error('[Complaint API] Unexpected Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
