// src/components/StyledAlert.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  buttons: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive' | 'primary';
  }[];
  onClose?: () => void;
}

export const StyledAlert: React.FC<StyledAlertProps> = ({
  visible,
  title,
  message,
  icon = 'information-circle',
  iconColor = '#4A7DFF',
  buttons,
  onClose,
}) => {
  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'primary':
        return styles.primaryButton;
      case 'destructive':
        return styles.destructiveButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'primary':
        return styles.primaryButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={icon as any} size={40} color={iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  getButtonStyle(button.style),
                  index > 0 && styles.buttonMargin,
                ]}
                onPress={button.onPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1A2A4F',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#8A8AAE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 8,
  },
  button: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMargin: {
    marginLeft: 8,
  },
  defaultButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  primaryButton: {
    backgroundColor: '#4A7DFF',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  destructiveButton: {
    backgroundColor: '#E74C3C',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#8A8AAE',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

export default StyledAlert;