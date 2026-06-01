import nodemailer from 'nodemailer';

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  let user = process.env.EMAIL_USER;
  let pass = process.env.EMAIL_PASS;

  // Fallback to Ethereal Email test account if credentials are not provided
  if (!user || !pass) {
    try {
      console.log('Generating Ethereal Email test account...');
      const testAccount = await nodemailer.createTestAccount();
      user = testAccount.user;
      pass = testAccount.pass;
      console.log(`Ethereal credentials generated. User: ${user}`);
    } catch (err) {
      console.error('Failed to create Ethereal Email account, falling back to empty credentials:', err);
    }
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const client = await createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Manshu Finance" <no-reply@manshufinance.com>',
      to,
      subject,
      html,
      attachments,
    };

    const info = await client.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    
    // Log preview link for Ethereal email
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`Ethereal Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Nodemailer send email error:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
