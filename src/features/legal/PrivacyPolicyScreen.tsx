// src/features/legal/PrivacyPolicyScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
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
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Text style={styles.subheading}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly to us, including your
          name, email address, phone number, location, profile photo, and any
          content you upload to the app, such as photos, videos, descriptions,
          and messages sent to other users.
        </Text>

        <Text style={styles.subheading}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use the information we collect to operate and improve the Munolink
          marketplace, connect buyers and sellers of nearby products and
          services, verify your identity, process transactions, provide
          customer support, and send you important account notifications.
        </Text>

        <Text style={styles.subheading}>3. Information Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. We share data only as
          necessary to run the app: with other users when you interact with
          them, and with service providers such as Supabase (database and
          authentication) and Google (sign-in). These providers are bound by
          their own privacy policies.
        </Text>

        <Text style={styles.subheading}>4. Data Storage and Security</Text>
        <Text style={styles.body}>
          Your data is stored on secure servers provided by Supabase. We use
          encryption in transit and access controls to protect it. No system
          is 100% secure, and we cannot guarantee absolute security.
        </Text>

        <Text style={styles.subheading}>5. Your Rights</Text>
        <Text style={styles.body}>
          You can access, update, or delete your account information at any
          time from within the app. To request deletion of all your data,
          contact us at aijukasti@gmail.com.
        </Text>

        <Text style={styles.subheading}>6. Children's Privacy</Text>
        <Text style={styles.body}>
          Munolink is not intended for users under 13 years old. We do not
          knowingly collect data from children.
        </Text>

        <Text style={styles.subheading}>7. Contact Us</Text>
        <Text style={styles.body}>
          For questions about this privacy policy, contact us at
          aijukasti@gmail.com.
        </Text>

        <View style={{ height: 40 }} />
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
    marginBottom: 24,
  },
  subheading: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});