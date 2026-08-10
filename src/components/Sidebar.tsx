import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
}

const NAV_ITEMS = [
  { name: 'Discover', icon: 'compass', route: 'Discover' },
  { name: 'Hub', icon: 'grid', route: 'Hub' },
  { name: 'Pay', icon: 'card', route: 'Pay' },
  { name: 'Inbox', icon: 'chatbubbles', route: 'Inbox' },
  { name: 'Account', icon: 'person', route: 'Account' },
];

export function Sidebar({ currentRoute, onNavigate }: Props) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        {/* ✅ image logo */}
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      {NAV_ITEMS.map((item) => (
        <TouchableOpacity
          key={item.route}
          style={[
            styles.navItem,
            currentRoute === item.route && styles.navItemActive,
          ]}
          onPress={() => onNavigate?.(item.route)}
        >
          <Ionicons
            name={item.icon as any}
            size={24}
            color={currentRoute === item.route ? '#4A7DFF' : '#8A8AAE'}
          />
          <Text
            style={[
              styles.navText,
              currentRoute === item.route && styles.navTextActive,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#1F2F5F',
    paddingVertical: 24,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  logoContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 150,
    height: 70,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.12)',
  },
  navText: {
    color: '#8A8AAE',
    fontSize: 14,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#4A7DFF',
  },
});