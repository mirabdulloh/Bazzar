import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { OrderStatus } from '../../libs/enums/order.enum';

@Injectable()
export class MailService {
	private readonly logger = new Logger('MailService');

	private readonly transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASS,
		},
	});

	private async send(to: string, subject: string, text: string): Promise<void> {
		try {
			await this.transporter.sendMail({
				from: process.env.MAIL_FROM,
				to,
				subject,
				text,
			});
			this.logger.verbose(`Email sent to ${to}: "${subject}"`);
		} catch (err) {
			this.logger.error(`Failed to send email to ${to}`, err);
		}
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

	public async sendNoticeEmail(to: string, noticeTitle: string, noticeContent: string): Promise<void> {
		await this.send(to, `[Bazaar Notice] ${noticeTitle}`, `${noticeContent}\n\nThe Bazaar Team`);
	}
}
