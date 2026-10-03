// src/components/StyledAlert.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export type StyledAlertButtonStyle =
  | 'default'
  | 'cancel'
  | 'destructive'
  | 'primary';

export interface StyledAlertButton {
  text: string;
  onPress: () => void;
  style?: StyledAlertButtonStyle;
}

export interface StyledAlertConfig {
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  buttons: StyledAlertButton[];
}

interface StyledAlertProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  buttons: StyledAlertButton[];
  onClose?: () => void;
}

export const StyledAlert: React.FC<StyledAlertProps> = ({
  visible,
  title,
  message,
  icon = 'information-circle-outline',
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
          <View style={styles.iconWrapper}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.divider} />

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  getButtonStyle(button.style),
                  index > 0 && styles.buttonDivider,
                ]}
                onPress={button.onPress}
                activeOpacity={0.6}
              >
                <Text
                  style={[styles.buttonText, getButtonTextStyle(button.style)]}
                >
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

/**
 * ✅ Imperative-friendly hook so screens can keep using an
 * `Alert.alert(title, message, buttons)`-style API while still
 * rendering the app-styled `StyledAlert` modal.
 *
 * Usage:
 *
 *   const { show, element } = useStyledAlert();
 *   ...
 *   show({ title, message, buttons, icon, iconColor });
 *   ...
 *   return (<View>{element}{ ...screen }</View>);
 */
export function useStyledAlert() {
  const [config, setConfig] = useState<StyledAlertConfig & { visible: boolean }>(
    {
      visible: false,
      title: '',
      message: '',
      buttons: [],
    }
  );

  const show = useCallback(
    (
      cfg:
        | StyledAlertConfig
        | string,
      message?: string,
      buttons?: StyledAlertButton[]
    ) => {
      if (typeof cfg === 'string') {
        setConfig({
          visible: true,
          title: cfg,
          message: message || '',
          buttons:
            buttons && buttons.length > 0
              ? buttons
              : [
                  {
                    text: 'OK',
                    style: 'primary',
                    onPress: () => setConfig((c) => ({ ...c, visible: false })),
                  },
                ],
        });
      } else {
        setConfig({
          visible: true,
          title: cfg.title,
          message: cfg.message,
          icon: cfg.icon,
          iconColor: cfg.iconColor,
          buttons:
            cfg.buttons && cfg.buttons.length > 0
              ? cfg.buttons
              : [
                  {
                    text: 'OK',
                    style: 'primary',
                    onPress: () => setConfig((c) => ({ ...c, visible: false })),
                  },
                ],
        });
      }
    },
    []
  );

  const hide = useCallback(() => {
    setConfig((c) => ({ ...c, visible: false }));
  }, []);

  const element = (
    <StyledAlert
      visible={config.visible}
      title={config.title}
      message={config.message}
      icon={config.icon}
      iconColor={config.iconColor}
      buttons={config.buttons}
      onClose={hide}
    />
  );

  return { show, hide, element };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#141B2E',
    borderRadius: 12,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 0,
    width: width * 0.82,
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74,125,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,125,255,0.12)',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  message: {
    fontSize: 13,
    color: '#8A8AAE',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDivider: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.06)',
  },
  defaultButton: {
    backgroundColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  defaultButtonText: {
    color: '#FFFFFF',
  },
  primaryButtonText: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#8A8AAE',
  },
  destructiveButtonText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
});

export default StyledAlert;