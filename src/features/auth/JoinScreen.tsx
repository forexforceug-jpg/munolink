// src/features/auth/JoinScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0D0D1A',
  bgInput: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8AAE',
  textMuted: '#6A7A9E',
  accent: '#4A7DFF',
  accentSoft: 'rgba(74,125,255,0.15)',
  error: '#E74C3C',
  google: '#FFFFFF',
  googleText: '#1F1F1F',
};

type SignupMethod = 'phone' | 'email';

const StepIndicator = ({ currentStep, totalSteps }: any) => (
  <View style={styles.stepIndicatorContainer}>
    {Array.from({ length: totalSteps }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i === currentStep && styles.stepDotActive,
          i < currentStep && styles.stepDotCompleted,
        ]}
      />
    ))}
  </View>
);

const JoinContent = ({ navigation }: any) => {
  const {
    signInWithGoogle,
    signUpWithEmail,
    verifyEmailOtp,
    signUpWithPhone,
    verifyPhoneOtp,
  } = useAuth();
  const { isDesktop } = useBreakpoint();

  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<SignupMethod>('phone');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpFocused, setOtpFocused] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputs.current[0]?.focus(), 300);
    }
  }, [step]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const isNameValid = fullName.trim().length >= 2;
  const isEmailValid = /\S+@\S+\.\S+/.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    isNameValid &&
    (method === 'phone'
      ? phoneNumber.length >= 7 && isPasswordValid
      : isEmailValid && isPasswordValid && passwordsMatch);

  // ============================================================
  // STEP 1: CREATE ACCOUNT (sends OTP via Supabase)
  // ============================================================
  const handleContinue = async () => {
    if (!isNameValid) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!isPasswordValid) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (method === 'phone') {
      if (phoneNumber.length < 7) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }

      setIsLoading(true);
      try {
        // Supabase handles OTP generation + storage.
        // The Send SMS Hook forwards the OTP to Yoola.
        const fullPhone = `+256${phoneNumber.replace(/\s/g, '')}`;
        await signUpWithPhone(fullPhone, password);
        setStep(2);
        setResendTimer(60);
      } catch (error: any) {
        console.error('Phone signup error:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to create account. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Email path
    if (!isEmailValid) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email.trim().toLowerCase(), password);
      setStep(2);
      setResendTimer(60);
    } catch (error: any) {
      console.error('Email signup error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // STEP 2: VERIFY OTP
  // ============================================================
  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'phone') {
        const fullPhone = `+256${phoneNumber.replace(/\s/g, '')}`;
        await verifyPhoneOtp(fullPhone, code);
      } else {
        await verifyEmailOtp(email.trim().toLowerCase(), code);
      }

      // onAuthStateChange in AuthContext takes over from here
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert(
        'Error',
        error.message || 'Invalid or expired code. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setResendTimer(60);

    try {
      if (method === 'phone') {
        const fullPhone = `+256${phoneNumber.replace(/\s/g, '')}`;
        // Re-trigger signup which resends the OTP
        await signUpWithPhone(fullPhone, password);
      } else {
        await signUpWithEmail(email.trim().toLowerCase(), password);
      }
      Alert.alert('Code Sent', 'A new verification code has been sent.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code.');
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const next = [...otp];
    next[index] = text;
    setOtp(next);
    if (text && index < 5) {
      otpInputs.current[index + 1]?.focus();
      setOtpFocused(index + 1);
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
      setOtpFocused(index - 1);
    }
  };

  // ============================================================
  // GOOGLE
  // ============================================================
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Auth state change handles navigation on native.
      // On web, the redirect happens and the user comes back signed in.
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ============================================================
  // RENDER STEP 1
  // ============================================================
  const renderStep1 = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.stepIconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.stepIconGradient}
        >
          <Text style={styles.stepIcon}>📱</Text>
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Create your Munolink Account</Text>
      <Text style={styles.stepSubtitle}>
        Join thousands of people discovering opportunities nearby.
      </Text>

      {/* Full Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={[styles.input, isNameValid && styles.inputFilled]}
          placeholder="Enter your full name"
          placeholderTextColor={COLORS.textMuted}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      {/* Method toggle */}
      <View style={styles.methodToggle}>
        <TouchableOpacity
          style={[
            styles.methodOption,
            method === 'phone' && styles.methodOptionActive,
          ]}
          onPress={() => setMethod('phone')}
        >
          <Ionicons
            name="call-outline"
            size={16}
            color={
              method === 'phone' ? COLORS.textPrimary : COLORS.textSecondary
            }
          />
          <Text
            style={[
              styles.methodText,
              method === 'phone' && styles.methodTextActive,
            ]}
          >
            Phone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.methodOption,
            method === 'email' && styles.methodOptionActive,
          ]}
          onPress={() => setMethod('email')}
        >
          <Ionicons
            name="mail-outline"
            size={16}
            color={
              method === 'email' ? COLORS.textPrimary : COLORS.textSecondary
            }
          />
          <Text
            style={[
              styles.methodText,
              method === 'email' && styles.methodTextActive,
            ]}
          >
            Email
          </Text>
        </TouchableOpacity>
      </View>

      {/* PHONE */}
      {method === 'phone' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.phoneInput}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+256</Text>
            </View>
            <TextInput
              style={styles.phoneInputField}
              placeholder="700 000 000"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={9}
            />
          </View>
        </View>
      )}

      {/* EMAIL */}
      {method === 'email' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[
              styles.input,
              isEmailValid && email && styles.inputFilled,
            ]}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      )}

      {/* PASSWORD (shown for both methods) */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordInput}>
          <TextInput
            style={styles.passwordField}
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONFIRM PASSWORD (only for email) */}
      {method === 'email' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.passwordField}
              placeholder="Re-enter password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.inputError}>Passwords do not match</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.continueButton,
          (isLoading || !canSubmit) && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={isLoading || !canSubmit}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>
            {method === 'phone' ? 'Send Code' : 'Create Account'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={[
          styles.googleButton,
          isGoogleLoading && styles.googleButtonDisabled,
        ]}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color={COLORS.googleText} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color={COLORS.googleText} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signInButton}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.signInText}>
          Already a member? <Text style={styles.signInLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>

    <Text style={styles.termsText}>
  By continuing, you agree to our{' '}
  <Text
    style={styles.termsLink}
    onPress={() => navigation.navigate('TermsOfService')}
  >
    Terms of Service
  </Text>{' '}
  and{' '}
  <Text
    style={styles.termsLink}
    onPress={() => navigation.navigate('PrivacyPolicy')}
  >
    Privacy Policy
  </Text>
</Text>
    </ScrollView>
  );

  // ============================================================
  // RENDER STEP 2 (OTP)
  // ============================================================
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepIconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.stepIconGradient}
        >
          <Text style={styles.stepIcon}>🔐</Text>
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Verify your {method === 'phone' ? 'phone' : 'email'}</Text>
      <Text style={styles.stepSubtitle}>
        We've sent a 6-digit code to{' '}
        <Text style={styles.highlightText}>
          {method === 'phone' ? `+256 ${phoneNumber}` : email}
        </Text>
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) otpInputs.current[index] = ref;
            }}
            style={[
              styles.otpInput,
              otpFocused === index && styles.otpInputFocused,
            ]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(t) => handleOtpChange(t, index)}
            onKeyPress={(e) => handleOtpKeyPress(e, index)}
            onFocus={() => setOtpFocused(index)}
          />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.verifyLoading}>
          <ActivityIndicator color={COLORS.accent} />
          <Text style={styles.verifyLoadingText}>Verifying...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.continueButton,
            otp.join('').length < 6 && styles.continueButtonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={otp.join('').length < 6}
        >
          <Text style={styles.continueButtonText}>Verify</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendOTP}
        disabled={resendTimer > 0}
      >
        <Text
          style={[
            styles.resendText,
            resendTimer > 0 && styles.resendTextDisabled,
          ]}
        >
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
        <Text style={styles.backText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, isDesktop && styles.containerDesktop]}
      edges={['top']}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {!isDesktop && (
          <TouchableOpacity
            style={styles.backArrow}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

        <StepIndicator currentStep={step - 1} totalSteps={2} />

        <View style={[styles.content, isDesktop && styles.contentDesktop]}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const JoinScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  if (isDesktop) {
    return (
      <ResponsiveLayout
        currentRoute="Join"
        onNavigate={(route) => navigation?.navigate(route)}
        floatingActions={null}
        hideContextPanel={true}
        fullWidth={true}
      >
        <JoinContent navigation={navigation} />
      </ResponsiveLayout>
    );
  }

  return <JoinContent navigation={navigation} />;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  containerDesktop: { backgroundColor: COLORS.bg, padding: 24 },
  keyboardView: { flex: 1 },
  backArrow: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 4 },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  stepDotActive: { width: 24, backgroundColor: COLORS.accent },
  stepDotCompleted: { backgroundColor: COLORS.accent },
  content: { flex: 1, paddingHorizontal: 24 },
  contentDesktop: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  scrollContent: { paddingBottom: 32 },
  stepContainer: { flex: 1, paddingTop: 20 },
  stepIconContainer: { alignItems: 'center', marginBottom: 16 },
  stepIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  stepIcon: { fontSize: 32 },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  highlightText: { color: COLORS.accent, fontWeight: '500' },
  inputLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputFilled: { borderWidth: 1, borderColor: COLORS.accent },
  inputError: { color: COLORS.error, fontSize: 12, marginTop: 4 },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  methodOptionActive: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.4)',
  },
  methodText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  methodTextActive: { color: COLORS.textPrimary },
  inputContainer: { marginBottom: 16 },
  input: {
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneInput: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
  },
  countryCodeText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '500' },
  phoneInputField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  eyeButton: { paddingHorizontal: 14 },
  continueButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  continueButtonDisabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.google,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginBottom: 16,
  },
  googleButtonDisabled: { opacity: 0.6 },
  googleButtonText: {
    color: COLORS.googleText,
    fontSize: 16,
    fontWeight: '500',
  },
  signInButton: { alignItems: 'center' },
  signInText: { color: COLORS.textSecondary, fontSize: 15 },
  signInLink: { color: COLORS.accent, fontWeight: '500' },
  termsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: { color: COLORS.accent },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 54,
    backgroundColor: COLORS.bgInput,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  otpInputFocused: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(74,125,255,0.08)',
  },
  verifyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  verifyLoadingText: { color: COLORS.accent, fontSize: 14 },
  resendButton: { alignItems: 'center', marginTop: 8 },
  resendText: { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
  resendTextDisabled: { color: COLORS.textSecondary },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  backText: { color: COLORS.textSecondary, fontSize: 14 },
});