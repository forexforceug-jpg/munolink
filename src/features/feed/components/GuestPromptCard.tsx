import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface GuestPromptCardProps {
  onJoinPress: () => void;
  onContinuePress: () => void;
}

export const GuestPromptCard: React.FC<GuestPromptCardProps> = ({
  onJoinPress,
  onContinuePress,
}) => {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(31, 47, 95, 0.85)', 'rgba(31, 47, 95, 0.95)']}
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
              <Ionicons name="heart-outline" size={16} color="#4A7DFF" />
              <Text style={styles.featureText}>Save opportunities</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="chatbubble-outline" size={16} color="#4A7DFF" />
              <Text style={styles.featureText}>Chat with businesses</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="calendar-outline" size={16} color="#4A7DFF" />
              <Text style={styles.featureText}>Book services</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="card-outline" size={16} color="#4A7DFF" />
              <Text style={styles.featureText}>Pay securely</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.joinButton} onPress={onJoinPress}>
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.joinGradient}
            >
              <Text style={styles.joinButtonText}>Join Munolink</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onContinuePress}>
            <Text style={styles.continueText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  gradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  features: {
    width: '100%',
    gap: 6,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  joinButton: {
    width: '100%',
    marginBottom: 10,
  },
  joinGradient: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  continueText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
});