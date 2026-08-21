// src/features/help/HelpSupportScreen.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const HelpSupportContent = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  const supportOptions = [
    { 
      id: 'faq', 
      icon: 'help-circle-outline', 
      label: 'Frequently Asked Questions', 
      subtitle: 'Find answers to common questions',
      color: '#4A7DFF',
    },
    { 
      id: 'email', 
      icon: 'mail-outline', 
      label: 'Email Support', 
      subtitle: 'support@munolink.com',
      color: '#2ECC71',
    },
    { 
      id: 'phone', 
      icon: 'call-outline', 
      label: 'Call Us', 
      subtitle: '+256 700 000 000',
      color: '#F1C40F',
    },
    { 
      id: 'chat', 
      icon: 'chatbubble-outline', 
      label: 'Live Chat', 
      subtitle: 'Available 24/7',
      color: '#9C27B0',
    },
  ];

  const handleOptionPress = (id: string) => {
    if (id === 'email') {
      Linking.openURL('mailto:support@munolink.com').catch(() => {
        Alert.alert('Error', 'Could not open email app');
      });
    } else if (id === 'phone') {
      Linking.openURL('tel:+256700000000').catch(() => {
        Alert.alert('Error', 'Could not open phone app');
      });
    } else {
      Alert.alert('Coming Soon', `${id} support will be available soon.`);
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            <Text style={styles.welcomeEmoji}>💬</Text>
            <Text style={styles.welcomeTitle}>How can we help you?</Text>
            <Text style={styles.welcomeSubtitle}>
              Choose an option below to get support
            </Text>
          </LinearGradient>
        </View>

        {/* Support Options */}
        {supportOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => handleOptionPress(option.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.color + '15' }]}>
              <Ionicons name={option.icon as any} size={24} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8A8AAE" />
          </TouchableOpacity>
        ))}

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#8A8AAE" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Response Time</Text>
              <Text style={styles.infoValue}>We typically respond within 24 hours</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#8A8AAE" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Secure & Private</Text>
              <Text style={styles.infoValue}>Your conversations are encrypted</Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <Text style={styles.versionText}>Munolink v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

export const HelpSupportScreen = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="HelpSupport" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <HelpSupportContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  desktopContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopContent: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#8A8AAE',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoContent: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2F5F',
  },
  infoValue: {
    fontSize: 12,
    color: '#8A8AAE',
    marginTop: 1,
  },
  versionText: {
    color: '#8A8AAE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});