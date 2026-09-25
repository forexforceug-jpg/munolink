// src/features/legal/TermsOfServiceScreen.tsx

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
};

export const TermsOfServiceScreen = ({ navigation }: any) => {
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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Munolink Terms of Service</Text>
        <Text style={styles.updated}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Text style={styles.subheading}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By using Munolink, you agree to these Terms of Service. If you do not
          agree, do not use the app.
        </Text>

        <Text style={styles.subheading}>2. Using Munolink</Text>
        <Text style={styles.body}>
          Munolink is a marketplace that connects buyers and sellers of
          products and services. You must be at least 13 years old to use the
          app. You agree to provide accurate information and to use the app
          only for lawful purposes.
        </Text>

        <Text style={styles.subheading}>3. Your Content</Text>
        <Text style={styles.body}>
          You are responsible for any content you upload, including photos,
          videos, descriptions, and messages. You must not post anything
          illegal, misleading, harmful, or that violates someone else's
          rights. We may remove content that violates these terms.
        </Text>

        <Text style={styles.subheading}>4. Transactions</Text>
        <Text style={styles.body}>
          Munolink does not handle payments between users directly. Any
          transaction is between the buyer and the seller. We are not
          responsible for the quality, safety, or legality of items listed, or
          for the completion of any transaction.
        </Text>

        <Text style={styles.subheading}>5. Account Termination</Text>
        <Text style={styles.body}>
          We may suspend or terminate your account if you violate these terms.
          You can delete your account at any time from within the app.
        </Text>

        <Text style={styles.subheading}>6. Limitation of Liability</Text>
        <Text style={styles.body}>
          Munolink is provided "as is" without warranties of any kind. We are
          not liable for any damages arising from your use of the app.
        </Text>

        <Text style={styles.subheading}>7. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these terms from time to time. Continued use of the app
          after changes means you accept the updated terms.
        </Text>

        <Text style={styles.subheading}>8. Contact Us</Text>
        <Text style={styles.body}>
          For questions about these terms, contact us at support@munolink.com.
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