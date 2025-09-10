import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  private renderTemplate(templateName: string, context: any) {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'email',
      'templates',
      `${templateName}.hbs`,
    );
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = Handlebars.compile(templateSource);
    return compiledTemplate(context);
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent to ${to} with subject "${subject}"`);
    } catch (err) {
      this.logger.error(` Failed to send email to ${to}: ${err.message}`);
      throw err;
    }
  }

  async sendVerificationEmail(to: string, code: string, ttl: Date) {
    const html = this.renderTemplate('verification', { code, ttl });
    return this.sendMail(to, 'Verify your email', '', html);
  }

  async sendForgotPasswordEmail(to: string, code: string, ttl: Date) {
    const html = this.renderTemplate('forgot-password', { code, ttl });
    return this.sendMail(to, 'Reset your password', '', html);
  }
}
