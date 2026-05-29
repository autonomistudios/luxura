/**
 * src/types/paypal.ts — PayPal JS SDK type definitions
 *
 * Replaces `(window as any).paypal` with a properly-typed global.
 * Covers only the methods we actually use; expand as needed.
 */

export interface PayPalCreateSubscriptionData {
  // PayPal passes an opaque object on createSubscription that we don't read
  paymentSource?: string;
}

export interface PayPalActions {
  subscription: {
    create: (params: { plan_id: string; custom_id?: string }) => Promise<string>;
  };
  order?: {
    capture: () => Promise<unknown>;
  };
}

export interface PayPalApprovalData {
  subscriptionID?: string;
  orderID?: string;
  payerID?: string;
}

export interface PayPalError {
  message?: string;
  name?: string;
  details?: unknown;
}

export interface PayPalButtonStyle {
  layout: 'vertical' | 'horizontal';
  color:  'gold' | 'blue' | 'silver' | 'white' | 'black';
  shape:  'rect' | 'pill';
  label:  'paypal' | 'checkout' | 'buynow' | 'pay' | 'subscribe';
  height?: number;
}

export interface PayPalButtonsConfig {
  style: PayPalButtonStyle;
  createSubscription: (data: PayPalCreateSubscriptionData, actions: PayPalActions) => Promise<string>;
  onApprove: (data: PayPalApprovalData, actions?: PayPalActions) => void;
  onError:   (err: PayPalError) => void;
}

export interface PayPalButtonsInstance {
  render: (selector: string | HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
}

export interface PayPalSDK {
  Buttons: (config: PayPalButtonsConfig) => PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalSDK;
  }
}

export {}; // ensure file is treated as a module
