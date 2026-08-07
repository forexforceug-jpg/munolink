import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface DesktopTopBarProps {
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress?: () => void;
  location?: string;
}

export function DesktopTopBar({
  onSearchPress,
  onNotificationsPress,
  onProfilePress,
  location = 'Jinja, Uganda',
}: DesktopTopBarProps) {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Left: Logo */}
      <View style={styles.leftSection}>
        <Text style={styles.logo}>Munolink</Text>
      </View>

      {/* Center: Search Bar */}
      <TouchableOpacity 
        style={styles.searchContainer}
        onPress={() => {
          if (onSearchPress) {
            onSearchPress();
          } else {
            navigation.navigate('Search' as never);
          }
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={20} color="#8A8AAE" />
        <Text style={styles.searchPlaceholder}>Search for products, shops, or services...</Text>
        <View style={styles.searchShortcut}>
          <Text style={styles.searchShortcutText}>⌘K</Text>
        </View>
      </TouchableOpacity>

      {/* Right: Actions */}
      <View style={styles.rightSection}>
        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={18} color="#4A7DFF" />
          <Text style={styles.locationText}>{location}</Text>
          <Ionicons name="chevron-down" size={14} color="#4A7DFF" />
        </View>

        {/* Notification Bell */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => onNotificationsPress?.()}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => {
            if (onProfilePress) {
              onProfilePress();
            } else {
              navigation.navigate('Account' as never);
            }
          }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>M</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1F2F5F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    height: 64,
    minHeight: 64,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 24,
    maxWidth: 640,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#8A8AAE',
    fontSize: 14,
  },
  searchShortcut: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchShortcutText: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
    justifyContent: 'flex-end',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  iconButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1F2F5F',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  profileButton: {
    marginLeft: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A7DFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});