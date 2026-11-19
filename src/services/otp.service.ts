import { authApi } from "../lib/api";

interface OTPResponse {
  success: boolean;
  error?: string;
}

export async function sendOTP(phone: string): Promise<OTPResponse> {
  try {
    await authApi.requestOtp({ phone });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send OTP.",
    };
  }
}

export async function verifyOTP(
  phone: string,
  token: string,
): Promise<OTPResponse> {
  try {
    await authApi.verifyOtp({ phone, token, type: "sms" });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "OTP verification failed.",
    };
  }
}

export function resendOTP(phone: string): Promise<OTPResponse> {
  return sendOTP(phone);
}
