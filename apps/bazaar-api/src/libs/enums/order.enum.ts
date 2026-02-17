import { registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
	PENDING = 'PENDING',
	CONFIRMED = 'CONFIRMED',
	SHIPPED = 'SHIPPED',
	DELIVERED = 'DELIVERED',
	CANCELLED = 'CANCELLED',
	REFUNDED = 'REFUNDED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

export enum OrderPaymentMethod {
	CREDIT_CARD = 'CREDIT_CARD',
	DEBIT_CARD = 'DEBIT_CARD',
	BANK_TRANSFER = 'BANK_TRANSFER',
	MOBILE_PAYMENT = 'MOBILE_PAYMENT',
	POINTS = 'POINTS',
}

registerEnumType(OrderPaymentMethod, { name: 'OrderPaymentMethod' });

export enum OrderPaymentStatus {
	PENDING = 'PENDING',
	PAID = 'PAID',
	FAILED = 'FAILED',
	REFUNDED = 'REFUNDED',
}

registerEnumType(OrderPaymentStatus, { name: 'OrderPaymentStatus' });

export enum orderDeliveryStatus {
	PREPARING = 'PREPARING',
	SHIPPING = 'SHIPPING',
	DELIVERED = 'DELIVERED',
}

registerEnumType(orderDeliveryStatus, { name: 'orderDeliveryStatus' });
