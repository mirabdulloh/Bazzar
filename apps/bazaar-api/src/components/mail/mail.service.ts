import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrderStatus } from '../../libs/enums/order.enum';

@Injectable()
export class MailService {
	private readonly logger = new Logger('MailService');
	private readonly mailProvider = (process.env.MAIL_PROVIDER ?? 'smtp').toLowerCase();
	private readonly resendApiUrl = 'https://api.resend.com/emails';

	/** Batch size and delay between batches for bulk sending */
	private readonly BATCH_SIZE = 5;
	private readonly BATCH_DELAY_MS = 1_500;

	/** Retry delays in ms: 10s → 60s → 3min */
	private readonly RETRY_DELAYS = [10_000, 60_000, 180_000];

	private readonly transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASS,
		},
	});

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private async sendViaResend(to: string, subject: string, text: string): Promise<void> {
		const apiKey = process.env.RESEND_API_KEY;
		const from = process.env.MAIL_FROM;

		if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
		if (!from) throw new Error('MAIL_FROM is not configured');

		const response = await fetch(this.resendApiUrl, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from,
				to: [to],
				subject,
				text,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Resend error ${response.status}: ${errorText}`);
		}
	}

	/** Send a single email with automatic retry + exponential backoff */
	private async send(to: string, subject: string, text: string): Promise<void> {
		for (let attempt = 0; attempt <= this.RETRY_DELAYS.length; attempt++) {
			try {
				if (this.mailProvider === 'resend') {
					await this.sendViaResend(to, subject, text);
				} else {
					await this.transporter.sendMail({
						from: process.env.MAIL_FROM,
						to,
						subject,
						text,
					});
				}
				this.logger.verbose(`Email sent to ${to}: "${subject}"`);
				return;
			} catch (err) {
				if (attempt < this.RETRY_DELAYS.length) {
					const delay = this.RETRY_DELAYS[attempt];
					this.logger.warn(`Email to ${to} failed (attempt ${attempt + 1}), retrying in ${delay / 1000}s…`);
					await this.sleep(delay);
				} else {
					this.logger.error(`Email to ${to} permanently failed after ${attempt + 1} attempts`, err);
				}
			}
		}
	}

	/**
	 * Send to many recipients in small batches to avoid SMTP rate limits.
	 * textFn receives the recipient address so you can personalise the body.
	 */
	public async sendBulk(
		recipients: string[],
		subject: string,
		textFn: (to: string) => string,
	): Promise<void> {
		for (let i = 0; i < recipients.length; i += this.BATCH_SIZE) {
			const batch = recipients.slice(i, i + this.BATCH_SIZE);
			await Promise.all(batch.map((to) => this.send(to, subject, textFn(to))));
			// Wait between batches (skip delay after the last batch)
			if (i + this.BATCH_SIZE < recipients.length) {
				await this.sleep(this.BATCH_DELAY_MS);
			}
		}
		this.logger.log(`Bulk email "${subject}" dispatched to ${recipients.length} recipients`);
	}

	public async sendWelcomeEmail(to: string, memberNick: string): Promise<void> {
		await this.send(
			to,
			'Welcome to Bazaar!',
			`Hi ${memberNick},\n\nThank you for joining Bazaar. Start shopping or discover brands today!\n\nThe Bazaar Team`,
		);
	}

	public async sendOrderConfirmedEmail(to: string, orderId: string, finalPrice: number): Promise<void> {
		await this.send(
			to,
			'Order Confirmed',
			`Your order has been placed successfully.\n\nOrder ID: ${orderId}\nTotal: $${finalPrice.toFixed(2)}\n\nWe will notify you when it ships.\n\nThe Bazaar Team`,
		);
	}

	public async sendOrderStatusEmail(to: string, orderId: string, status: OrderStatus): Promise<void> {
		const messages: Partial<Record<OrderStatus, { subject: string; body: string }>> = {
			[OrderStatus.SHIPPED]: {
				subject: 'Your order is on its way!',
				body: `Good news — your order (ID: ${orderId}) has been shipped and is on its way to you.`,
			},
			[OrderStatus.DELIVERED]: {
				subject: 'Your order has been delivered',
				body: `Your order (ID: ${orderId}) has been delivered. We hope you enjoy your purchase!`,
			},
			[OrderStatus.CANCELLED]: {
				subject: 'Your order has been cancelled',
				body: `Your order (ID: ${orderId}) has been cancelled. If you have questions, please contact support.`,
			},
		};

		const msg = messages[status];
		if (!msg) return;
		await this.send(to, msg.subject, `${msg.body}\n\nThe Bazaar Team`);
	}

	public async sendEmailVerificationEmail(to: string, token: string): Promise<void> {
		const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
		await this.send(
			to,
			'Verify your Bazaar email',
			`Click the link to verify your email:\n\n${link}\n\nThis link expires in 24 hours.\n\nThe Bazaar Team`,
		);
	}

	public async sendPasswordResetEmail(to: string, token: string): Promise<void> {
		const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
		await this.send(
			to,
			'Reset your Bazaar password',
			`Click the link to reset your password:\n\n${link}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.\n\nThe Bazaar Team`,
		);
	}

	/** Single recipient notice */
	public async sendNoticeEmail(to: string, noticeTitle: string, noticeContent: string): Promise<void> {
		await this.send(to, `[Bazaar Notice] ${noticeTitle}`, `${noticeContent}\n\nThe Bazaar Team`);
	}

	/** Bulk notice — sends to all recipients in batches with retry */
	public async sendBulkNoticeEmail(recipients: string[], noticeTitle: string, noticeContent: string): Promise<void> {
		const subject = `[Bazaar Notice] ${noticeTitle}`;
		const body = `${noticeContent}\n\nThe Bazaar Team`;
		await this.sendBulk(recipients, subject, () => body);
	}
}
