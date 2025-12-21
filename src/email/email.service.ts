import { Inject, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import emailConfig from 'app/config/email.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    @Inject(emailConfig.KEY)
    private readonly config: ConfigType<typeof emailConfig>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPass,
      },
    });

    console.log('Email transport created with config: ', this.config);
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
      this.logger.log(
        `Sending email to ${to} with subject "${subject}" from ${this.config.smtpFrom}`,
      );
      await this.transporter.sendMail({
        from: `"${process.env.APP_NAME}" <${this.config.smtpFrom}>`,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email sent to ${to} with subject "${subject}"`);
    } catch (err) {
      this.logger.error(
        ` Failed to send email to ${to}: ${err.message as string}`,
      );
      throw err;
    }
  }

  async sendVerificationEmail(to: string, code: string, ttl: Date) {
    const html = this.renderTemplate('verification', {
      code,
      ttl: this.getMinutes(ttl),
    });
    return this.sendMail(to, 'Verify your email', '', html);
  }

  async sendForgotPasswordEmail(to: string, code: string, ttl: Date) {
    const html = this.renderTemplate('forgot-password', {
      code,
      ttl: this.getMinutes(ttl),
    });
    return this.sendMail(to, 'Reset your password', '', html);
  }

  private getMinutes = (date: Date) => {
    const now = new Date();
    return Math.round((date.getTime() - now.getTime()) / 60000);
  };
}
