// screens/OTPVerification.js
import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { verifyOTP, resendOTP } from '../services/otpService';

export default function OTPVerification({ navigation, route }) {
    const phoneNumber = route?.params?.phoneNumber || '+256700123456';
    const role = route?.params?.role || 'customer';
    const isExistingUser = route?.params?.isExistingUser || false;

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [activeIndex, setActiveIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(105);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...code];

        if (text.length <= 1) {
            newCode[index] = text;
            setCode(newCode);

            if (text.length === 1 && index < 5) {
                setActiveIndex(index + 1);
                inputRefs.current[index + 1]?.focus();
            }

            const allFilled = newCode.every((digit) => digit !== '');
            if (allFilled) {
                verifyOTPCode(newCode.join(''));
            }
        }
    };

    const verifyOTPCode = async (otpCode) => {
        setLoading(true);

        try {
            // Verify OTP using custom service
            const result = await verifyOTP(phoneNumber, otpCode);

            if (!result.success) {
                Alert.alert(
                    'Invalid Code',
                    result.error || 'The code you entered is incorrect. Please try again.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                setCode(['', '', '', '', '', '']);
                                setActiveIndex(0);
                                inputRefs.current[0]?.focus();
                            },
                        },
                    ]
                );
                setLoading(false);
                return;
            }

            // Check if user exists in Supabase
            const { data: existingUser, error: userError } = await supabase
                .from('users')
                .select('id, full_name, role, wallet_balance, lifetime_savings')
                .eq('phone_number', phoneNumber)
                .maybeSingle();

            if (userError && userError.code !== 'PGRST116') {
                console.error('User fetch error:', userError);
                Alert.alert('Error', 'Failed to verify user. Please try again.');
                setLoading(false);
                return;
            }

            if (existingUser) {
                // User exists - log them in
                // You'll need to create a session or use Supabase sign in
                navigation.navigate('Dashboard', {
                    user: existingUser,
                    phoneNumber: phoneNumber,
                });
            } else {
                // New user - navigate to pin creation
                navigation.navigate('CreatePin', {
                    phoneNumber: phoneNumber,
                    role: role,
                });
            }

        } catch (error) {
            console.error('Verify error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
            setActiveIndex(index - 1);
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if (resendLoading) return;

        setResendLoading(true);

        try {
            const result = await resendOTP(phoneNumber);

            if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to resend code. Please try again.');
                setResendLoading(false);
                return;
            }

            setTimeLeft(105);
            setCode(['', '', '', '', '', '']);
            setActiveIndex(0);
            inputRefs.current[0]?.focus();
            Alert.alert('Success', 'A new verification code has been sent to your phone.');

        } catch (error) {
            console.error('Resend error:', error);
            Alert.alert('Error', 'Failed to resend code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#212121" />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.illustration}>
                    <View style={styles.messageBubble}>
                        <View style={styles.bubbleDots}>
                            <View style={[styles.bubbleDot, styles.dotActive]} />
                            <View style={[styles.bubbleDot, styles.dotInactive]} />
                            <View style={[styles.bubbleDot, styles.dotInactive]} />
                        </View>
                    </View>
                    <View style={styles.phoneIcon}>
                        <Ionicons name="lock-closed" size={28} color="#006B3F" />
                    </View>
                </View>

                <Text style={styles.heading}>Enter the code we sent you</Text>

                <Text style={styles.subtitle}>
                    We sent a 6-digit code to{' '}
                    <Text style={styles.phoneHighlight}>{phoneNumber}</Text>
                </Text>

                <View style={styles.otpContainer}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                                styles.otpBox,
                                activeIndex === index && styles.otpBoxActive,
                                digit !== '' && styles.otpBoxFilled,
                            ]}
                            value={digit}
                            onChangeText={(text) => handleCodeChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            editable={!loading}
                            onFocus={() => setActiveIndex(index)}
                        />
                    ))}
                </View>

                {loading && (
                    <Text style={styles.verifyingText}>Verifying...</Text>
                )}

                <View style={styles.timerContainer}>
                    <Ionicons name="time-outline" size={16} color="#888888" />
                    <Text style={styles.timerText}>
                        Code expires in{' '}
                        <Text style={styles.timerHighlight}>{formatTime(timeLeft)}</Text>
                    </Text>
                </View>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <TouchableOpacity 
                        onPress={handleResend}
                        disabled={resendLoading || timeLeft > 60}
                    >
                        <Text style={[
                            styles.resendLink,
                            (resendLoading || timeLeft > 60) && styles.resendDisabled
                        ]}>
                            {resendLoading ? 'Sending...' : 'Resend Code'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Display SMS balance (optional - admin only) */}
                {/* Uncomment for admin testing */}
                {/* 
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceText}>
                        SMS Balance: {balance} credits
                    </Text>
                </View>
                */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingTop: 110,
        paddingHorizontal: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    illustration: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        gap: 12,
    },
    messageBubble: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleDots: {
        flexDirection: 'row',
        gap: 5,
        alignItems: 'center',
    },
    bubbleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: '#006B3F',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotInactive: {
        backgroundColor: '#A5D6A7',
    },
    phoneIcon: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heading: {
        fontSize: 24,
        fontWeight: '800',
        color: '#212121',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#888888',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    phoneHighlight: {
        color: '#006B3F',
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    otpBox: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        fontSize: 22,
        fontWeight: '700',
        color: '#212121',
        textAlign: 'center',
        backgroundColor: '#F8F8F8',
    },
    otpBoxActive: {
        borderColor: '#006B3F',
        backgroundColor: '#FFFFFF',
    },
    otpBoxFilled: {
        borderColor: '#006B3F',
        backgroundColor: '#E8F5E9',
    },
    verifyingText: {
        fontSize: 14,
        color: '#006B3F',
        fontWeight: '600',
        marginBottom: 12,
    },
    timerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    timerText: {
        fontSize: 14,
        color: '#888888',
        fontWeight: '500',
    },
    timerHighlight: {
        color: '#006B3F',
        fontWeight: '700',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    resendText: {
        fontSize: 14,
        color: '#888888',
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#006B3F',
    },
    resendDisabled: {
        color: '#CCCCCC',
    },
});