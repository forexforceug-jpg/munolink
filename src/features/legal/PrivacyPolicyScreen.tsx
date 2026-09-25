// src/features/legal/PrivacyPolicyScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0D0D1A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0',
  accent: '#4A7DFF',
};

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Munolink Privacy Policy</Text>
        <Text style={styles.updated}>
          Effective date: January 1, 2026 • Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Text style={styles.intro}>
          Munolink ("we", "us", or "our") operates the Munolink mobile and web
          application available at https://munolink.com. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your
          information when you use our service. Please read it carefully. By
          using Munolink, you agree to the practices described in this policy.
        </Text>

        <Text style={styles.subheading}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect several types of information from and about users of our
          service:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Information you provide directly:</Text>{' '}
          full name, email address, phone number, password, profile photo,
          biography, and location (city, region, country). You provide this
          when you create an account or update your profile.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Content you upload:</Text> photos,
          videos, product and service descriptions, prices, categories,
          comments, and messages you send to other users. This content is
          stored on our servers and displayed to other users as part of the
          marketplace.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Location data:</Text> with your
          permission, we collect your approximate geographic location (GPS
          coordinates) to show you nearby products, services, and sellers. You
          can disable location access at any time in your device settings.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Google Account data (Google Sign-In):</Text>{' '}
          when you sign in with Google, we receive your basic Google profile
          information: your name, email address, profile picture, and a
          unique Google account identifier. We use this information solely to
          create and authenticate your Munolink account. We do not receive
          your Google password, and we do not access your Gmail, Google Drive,
          Google Calendar, Google Contacts, or any other Google service data.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Device and usage information:</Text> IP
          address, browser type, operating system, and general usage patterns
          used for security, fraud prevention, and improving the service.
        </Text>

        <Text style={styles.subheading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bullet}>
          • Create, maintain, and secure your Munolink account.
        </Text>
        <Text style={styles.bullet}>
          • Operate the marketplace and connect buyers with sellers of nearby
          products and services.
        </Text>
        <Text style={styles.bullet}>
          • Display your profile, listings, and content to other users of the
          platform.
        </Text>
        <Text style={styles.bullet}>
          • Enable messaging, following, liking, saving, and reviewing.
        </Text>
        <Text style={styles.bullet}>
          • Personalize recommendations for nearby opportunities.
        </Text>
        <Text style={styles.bullet}>
          • Send you account notifications, security alerts, and service
          updates.
        </Text>
        <Text style={styles.bullet}>
          • Respond to your support requests and questions.
        </Text>
        <Text style={styles.bullet}>
          • Detect, prevent, and address fraud, abuse, and technical issues.
        </Text>
        <Text style={styles.bullet}>
          • Comply with legal obligations.
        </Text>

        <Text style={styles.subheading}>3. How We Share Your Information</Text>
        <Text style={styles.body}>
          We do not sell, rent, or trade your personal information. We share
          your information only in the following circumstances:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>With other users:</Text> your public
          profile information (name, photo, bio, city) and the content you
          post is visible to other Munolink users.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>With service providers:</Text> we use
          trusted third-party service providers to operate Munolink,
          including Supabase (database, authentication, file storage) and
          Google (Google Sign-In, Google Maps). These providers only receive
          the data necessary to perform their specific functions and are
          contractually obligated to protect it.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>For legal reasons:</Text> we may
          disclose information if required by law, subpoena, or court order,
          or if we believe disclosure is necessary to protect the rights,
          property, or safety of Munolink, our users, or the public.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Business transfers:</Text> if Munolink
          is involved in a merger, acquisition, or sale of assets, your
          information may be transferred. We will notify you before your data
          is transferred and becomes subject to a different privacy policy.
        </Text>
        <Text style={styles.body}>
          We do not share Google user data with any third party for
          advertising, marketing, or analytics purposes. Google user data is
          used exclusively for authentication and to display your basic
          profile information within the app.
        </Text>

        <Text style={styles.subheading}>4. Data Storage and Security</Text>
        <Text style={styles.body}>
          Your data is stored on secure servers provided by Supabase, located
          in the European Union (Frankfurt region). We implement
          industry-standard security measures including encryption in transit
          (HTTPS/TLS), access controls, and regular security reviews. However,
          no method of transmission or storage is 100% secure. We cannot
          guarantee absolute security, but we work continuously to protect
          your information.
        </Text>

        <Text style={styles.subheading}>5. Data Retention</Text>
        <Text style={styles.body}>
          We retain your personal information for as long as your account is
          active. If you delete your account, we will delete or anonymize your
          personal information within 30 days, except where we are required to
          retain it for legal, tax, or fraud-prevention purposes.
        </Text>

        <Text style={styles.subheading}>6. Your Rights and Choices</Text>
        <Text style={styles.body}>
          You have the following rights regarding your information:
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Access and update:</Text> you can view
          and edit your account information at any time from the Account
          screen in the app.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Delete:</Text> you can delete your
          account and all associated content from the Account screen, or by
          emailing us.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Location:</Text> you can disable
          location access in your device settings at any time.
        </Text>
        <Text style={styles.bullet}>
          • <Text style={styles.bold}>Revoke Google access:</Text> you can
          revoke Munolink's access to your Google account at{' '}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL('https://myaccount.google.com/permissions')}
          >
            https://myaccount.google.com/permissions
          </Text>
          .
        </Text>

        <Text style={styles.subheading}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          Munolink is not intended for use by children under 13 years of age.
          We do not knowingly collect personal information from children under
          13. If you believe we have collected information from a child under
          13, please contact us immediately.
        </Text>

        <Text style={styles.subheading}>8. International Data Transfers</Text>
        <Text style={styles.body}>
          Your information may be transferred to, stored, and processed in
          countries other than your own, including the European Union where
          our database servers are located. We take appropriate measures to
          ensure your information receives an adequate level of protection.
        </Text>

        <Text style={styles.subheading}>9. Changes to This Privacy Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. When we do, we
          will update the "Last updated" date at the top of this page and, for
          material changes, notify you through the app or by email. We
          encourage you to review this policy periodically.
        </Text>

        <Text style={styles.subheading}>10. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions, concerns, or requests regarding this Privacy
          Policy or your personal information, please contact us at:
        </Text>
        <Text style={styles.contact}>Email: support@munolink.com</Text>
        <Text style={styles.contact}>Website: https://munolink.com</Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  content: { padding: 24 },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  updated: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 20,
  },
  intro: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  subheading: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 6,
  },
  bold: { color: COLORS.textPrimary, fontWeight: '600' },
  link: { color: COLORS.accent },
  contact: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
  },
});