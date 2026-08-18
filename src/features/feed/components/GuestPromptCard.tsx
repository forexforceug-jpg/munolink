// src/features/feed/components/GuestPromptCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface GuestPromptCardProps {
  onJoinPress: () => void;
  onContinuePress: () => void;
  visible?: boolean;
}

export const GuestPromptCard: React.FC<GuestPromptCardProps> = ({
  onJoinPress,
  onContinuePress,
  visible = true,
}) => {
  // If not visible, return null
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onContinuePress}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(31, 47, 95, 0.95)', 'rgba(31, 47, 95, 0.98)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🚀</Text>
              </View>
              
              <Text style={styles.title}>Welcome to Munolink</Text>
              <Text style={styles.subtitle}>
                You're browsing as a guest.{'\n'}
                Create a free account to:
              </Text>

              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="heart-outline" size={16} color="#4A7DFF" />
                  </View>
                  <Text style={styles.featureText}>Save opportunities</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="chatbubble-outline" size={16} color="#4A7DFF" />
                  </View>
                  <Text style={styles.featureText}>Chat with businesses</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="calendar-outline" size={16} color="#4A7DFF" />
                  </View>
                  <Text style={styles.featureText}>Book services</Text>
                </View>
                <View style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <Ionicons name="card-outline" size={16} color="#4A7DFF" />
                  </View>
                  <Text style={styles.featureText}>Pay securely</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.joinButton} onPress={onJoinPress} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#4A7DFF', '#6B94FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.joinGradient}
                >
                  <Text style={styles.joinButtonText}>Join Munolink</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={onContinuePress} activeOpacity={0.7}>
                <Text style={styles.continueText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  card: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  gradient: {
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.2)',
  },
  icon: {
    fontSize: 32,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
  },
  features: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  joinButton: {
    width: '100%',
    marginBottom: 12,
  },
  joinGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  continueText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
});