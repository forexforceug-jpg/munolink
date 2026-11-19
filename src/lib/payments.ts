import { apiRequest } from "./api";

type PaymentActionResult = {
  payment?: Record<string, any>;
  message?: Record<string, any>;
  transaction?: Record<string, any>;
  balance?: number;
  replayed?: boolean;
};

export const paymentsApi = {
  create: (input: {
    toUserId: string;
    amount: number;
    reason: string;
    isRequest: boolean;
    idempotencyKey?: string;
  }) =>
    apiRequest<PaymentActionResult>("/payments", {
      method: "POST",
      body: input,
    }),

  transfer: (input: {
    toUserId: string;
    amount: number;
    reason: string;
    idempotencyKey: string;
  }) =>
    apiRequest<PaymentActionResult>("/payments/wallet/transfer", {
      method: "POST",
      body: input,
    }),

  accept: (id: string) =>
    apiRequest<PaymentActionResult>(
      `/payments/${encodeURIComponent(id)}/accept`,
      {
        method: "POST",
        body: {},
      },
    ),

  complete: (id: string) =>
    apiRequest<PaymentActionResult>(
      `/payments/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        body: {},
      },
    ),

  release: (id: string) =>
    apiRequest<PaymentActionResult>(
      `/payments/${encodeURIComponent(id)}/release`,
      {
        method: "POST",
        body: {},
      },
    ),

  dispute: (id: string, reason: string) =>
    apiRequest<PaymentActionResult>(
      `/payments/${encodeURIComponent(id)}/dispute`,
      {
        method: "POST",
        body: { reason },
      },
    ),

  cancel: (id: string, action: "cancel" | "reject" = "cancel") =>
    apiRequest<PaymentActionResult>(
      `/payments/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        body: { action },
      },
    ),

  update: (id: string, input: { amount: number; reason: string }) =>
    apiRequest<PaymentActionResult>(`/payments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: input,
    }),

  walletBalance: () =>
    apiRequest<{ balance: number }>("/payments/wallet/balance"),

  topUp: (amount: number, method: string) =>
    apiRequest<PaymentActionResult>("/payments/wallet/top-up", {
      method: "POST",
      body: { amount, method },
    }),

  withdraw: (amount: number, method: string) =>
    apiRequest<PaymentActionResult>("/payments/wallet/withdraw", {
      method: "POST",
      body: { amount, method },
    }),
};
