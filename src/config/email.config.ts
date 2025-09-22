import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || 'your_email@gmail.com',
  smtpPass: process.env.SMTP_PASS || 'your_email_password',
  smtpFrom: process.env.SMTP_FROM || 'your_email@gmail.com',
}));
