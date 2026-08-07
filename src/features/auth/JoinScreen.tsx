import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// --- Sub-components ---

// Step Indicator
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

// --- Main JoinScreen Component ---
export const JoinScreen = ({ navigation }: any) => {
  const { signIn, signInWithPhone, signInWithGoogle } = useAuth();
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpFocused, setOtpFocused] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  const otpInputs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Animate welcome
  useEffect(() => {
    if (showWelcome) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [showWelcome]);

  const handleSendOTP = async () => {
    const identifier = method === 'phone' ? phoneNumber : email;
    if (!identifier) {
      Alert.alert('Error', `Please enter your ${method}`);
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStep(2);
      setResendTimer(30);
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const phone = phoneNumber;
      const fullPhone = `+256${phone}`;
      
      console.log('📝 Verifying OTP for phone (custom auth):', fullPhone);
      
      // Use signInWithPhone with just the phone number
      await signInWithPhone(fullPhone);
      
      console.log('✅ User signed in successfully');
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Error', error.message || 'Failed to verify. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    Alert.alert('Code Sent', 'A new verification code has been sent');
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

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

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // The auth state will update via the context
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', error.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleJoin = () => {
    navigation.replace('MainTabs');
  };

  // --- Render Step 1: Join Munolink ---
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
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

      <View style={styles.methodToggle}>
        <TouchableOpacity
          style={[styles.methodOption, method === 'phone' && styles.methodOptionActive]}
          onPress={() => setMethod('phone')}
        >
          <Text style={[styles.methodText, method === 'phone' && styles.methodTextActive]}>
            Phone Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodOption, method === 'email' && styles.methodOptionActive]}
          onPress={() => setMethod('email')}
        >
          <Text style={[styles.methodText, method === 'email' && styles.methodTextActive]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        {method === 'phone' ? (
          <View style={styles.phoneInput}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>+256</Text>
            </View>
            <TextInput
              style={styles.phoneInputField}
              placeholder="700 000 000"
              placeholderTextColor="#8A8AAE"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={9}
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#8A8AAE"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.divider} />
      </View>

      {/* Google Sign-In Button */}
      <TouchableOpacity
        style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <ActivityIndicator color="#212121" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#212121" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.signInText}>
          Already a member? <Text style={styles.signInLink}>Sign In</Text>
        </Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </View>
  );

  // --- Render Step 2: Verify OTP ---
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

      <Text style={styles.stepTitle}>Verify your {method}</Text>
      <Text style={styles.stepSubtitle}>
        We've sent a 6-digit code to{' '}
        <Text style={styles.highlightText}>
          {method === 'phone' ? phoneNumber : email}
        </Text>
      </Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref) {
                otpInputs.current[index] = ref;
              }
            }}
            style={[styles.otpInput, otpFocused === index && styles.otpInputFocused]}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            onKeyPress={(e) => handleOtpKeyPress(e, index)}
            onFocus={() => setOtpFocused(index)}
            secureTextEntry={false}
          />
        ))}
      </View>

      {isLoading ? (
        <View style={styles.verifyLoading}>
          <ActivityIndicator color="#4A7DFF" />
          <Text style={styles.verifyLoadingText}>Verifying...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.continueButton, otp.join('').length < 6 && styles.continueButtonDisabled]}
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
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
          {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <Ionicons name="arrow-back" size={16} color="#8A8AAE" />
        <Text style={styles.backText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );

  // --- Render Step 3: Welcome ---
  const renderStep3 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <View style={styles.welcomeContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.welcomeGradient}
        >
          <Text style={styles.welcomeEmoji}>🎉</Text>
        </LinearGradient>
      </View>

      <Text style={styles.welcomeTitle}>You're now a Munolink Member!</Text>
      <Text style={styles.welcomeSubtitle}>
        Here's what you can do now:
      </Text>

      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="heart" size={20} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Save & Follow</Text>
            <Text style={styles.featureDesc}>Save products and follow businesses you love</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="chatbubble" size={20} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Chat & Book</Text>
            <Text style={styles.featureDesc}>Message businesses and book services instantly</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Ionicons name="card" size={20} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.featureTitle}>Pay & Checkout</Text>
            <Text style={styles.featureDesc}>Pay securely and track your orders</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.continueButton} onPress={handleJoin}>
        <Text style={styles.continueButtonText}>Start Exploring</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.businessButton}
        onPress={() => {
          console.log('Navigate to Business Registration');
        }}
      >
        <Text style={styles.businessButtonText}>
          Want to sell or offer services?{' '}
          <Text style={styles.businessButtonLink}>Start a Business</Text>
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>

        <StepIndicator currentStep={step - 1} totalSteps={3} />

        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  backArrow: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
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
    backgroundColor: '#E8ECF4',
  },
  stepDotActive: {
    width: 24,
    backgroundColor: '#4A7DFF',
  },
  stepDotCompleted: {
    backgroundColor: '#4A7DFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 32,
  },
  stepTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  highlightText: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  methodOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodOptionActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  methodText: {
    color: '#8A8AAE',
    fontSize: 14,
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#1F2F5F',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1F2F5F',
    fontSize: 16,
  },
  phoneInput: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
  },
  countryCodeText: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '500',
  },
  phoneInputField: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1F2F5F',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8ECF4',
  },
  dividerText: {
    color: '#8A8AAE',
    fontSize: 13,
    paddingHorizontal: 16,
  },
  // Google Button Styles
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    gap: 8,
    marginBottom: 16,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '500',
  },
  signInButton: {
    alignItems: 'center',
  },
  signInText: {
    color: '#8A8AAE',
    fontSize: 15,
  },
  signInLink: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
  termsText: {
    color: '#8A8AAE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: '#4A7DFF',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  otpInput: {
    width: 44,
    height: 54,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  otpInputFocused: {
    borderWidth: 2,
    borderColor: '#4A7DFF',
    backgroundColor: '#FFFFFF',
  },
  verifyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  verifyLoadingText: {
    color: '#4A7DFF',
    fontSize: 14,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#8A8AAE',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  backText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 48,
  },
  welcomeTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  featureDesc: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  businessButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  businessButtonText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  businessButtonLink: {
    color: '#4A7DFF',
    fontWeight: '500',
  },
});