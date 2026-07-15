// src/services/otpService.js
import { supabase } from '../lib/supabase';

// Use the Supabase Edge Function instead of calling Yoola directly
const SUPABASE_URL = 'https://ffbjvrwkvnwocuyapajo.supabase.co';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-sms`;

console.log('🔑 Using Edge Function for SMS:', EDGE_FUNCTION_URL);

// Generate a random 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS via Supabase Edge Function (NO CORS ISSUES!)
export const sendSMS = async (phone, message, sender = 'ATInfo') => {
    try {
        console.log(`📤 Sending SMS to ${phone} via Edge Function...`);
        console.log(`📝 Message: ${message.substring(0, 30)}...`);
        
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                message: message,
                sender: sender,
            }),
        });

        const result = await response.json();

        if (result.status === 'success') {
            console.log(`✅ SMS sent successfully`);
            console.log(`💰 Remaining balance: ${result.balance} credits`);
            return { success: true, data: result };
        } else {
            console.error('❌ SMS failed:', result);
            return { success: false, error: result.message || 'Failed to send SMS' };
        }
    } catch (error) {
        console.error('❌ SMS error:', error);
        return { success: false, error: error.message };
    }
};

// Send OTP to user
export const sendOTP = async (phone) => {
    try {
        console.log(`📱 Sending OTP to ${phone}...`);
        
        // Validate phone number
        if (!phone || !phone.startsWith('+256')) {
            return { success: false, error: 'Invalid phone number format. Use +256...' };
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        console.log(`🔑 Generated OTP ${otp} for ${phone}`);

        // Store OTP in database
        const { error: dbError } = await supabase
            .from('otp_verifications')
            .insert({
                phone: phone,
                otp: otp,
                expires_at: expiresAt.toISOString(),
                verified: false,
                attempts: 0,
            });

        if (dbError) {
            console.error('❌ Database error:', dbError);
            
            // Check if it's a permission error
            if (dbError.code === '42501') {
                return { 
                    success: false, 
                    error: 'Database permission error. Please contact support.', 
                    details: dbError 
                };
            }
            
            return { success: false, error: 'Failed to store OTP' };
        }

        console.log('✅ OTP stored in database');

        // Send OTP via Edge Function (NOT directly to Yoola)
        const message = `Your Munolink verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
        const smsResult = await sendSMS(phone, message, 'Munolink');

        if (!smsResult.success) {
            // Delete the OTP if SMS fails
            await supabase
                .from('otp_verifications')
                .delete()
                .eq('phone', phone)
                .eq('otp', otp);
            
            return { success: false, error: smsResult.error };
        }

        console.log('✅ OTP sent successfully');
        return { success: true, otp: otp };
    } catch (error) {
        console.error('❌ Send OTP error:', error);
        return { success: false, error: error.message };
    }
};

// Verify OTP
export const verifyOTP = async (phone, otp) => {
    try {
        console.log(`🔍 Verifying OTP for ${phone}...`);
        
        // Check if OTP exists and is valid
        const { data, error } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('phone', phone)
            .eq('otp', otp)
            .eq('verified', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('❌ Database error:', error);
            return { success: false, error: 'Database error' };
        }

        if (!data || data.length === 0) {
            console.log('❌ Invalid or expired OTP');
            return { success: false, error: 'Invalid or expired OTP' };
        }

        console.log('✅ OTP found in database');

        // Check attempts
        if (data[0].attempts >= 3) {
            console.log('❌ Too many failed attempts');
            return { success: false, error: 'Too many failed attempts. Please request a new code.' };
        }

        // Mark OTP as verified
        const { error: updateError } = await supabase
            .from('otp_verifications')
            .update({ 
                verified: true,
                attempts: data[0].attempts + 1
            })
            .eq('id', data[0].id);

        if (updateError) {
            console.error('❌ Update error:', updateError);
            return { success: false, error: 'Failed to verify OTP' };
        }

        console.log('✅ OTP verified successfully');
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        return { success: false, error: error.message };
    }
};

// Resend OTP
export const resendOTP = async (phone) => {
    try {
        console.log(`🔄 Resending OTP to ${phone}...`);
        
        // Invalidate old OTPs for this phone
        await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('phone', phone)
            .eq('verified', false);

        // Send new OTP
        return await sendOTP(phone);
    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        return { success: false, error: error.message };
    }
};

// Check remaining SMS balance (via Edge Function)
export const checkBalance = async () => {
    try {
        // You can create a separate Edge Function for checking balance
        // For now, we'll return a message
        return { 
            message: 'Check balance via Yoola dashboard',
            error: 'Balance check not implemented in Edge Function yet'
        };
    } catch (error) {
        console.error('❌ Balance check error:', error);
        return { error: error.message };
    }
};