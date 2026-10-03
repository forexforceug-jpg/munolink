// src/components/Sidebar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SidebarRouteKind = 'tab' | 'stack';

export interface SidebarNavItem {
  name: string;
  icon: string;
  route: string;
  kind: SidebarRouteKind;
}

interface Props {
  currentRoute?: string;
  onNavigate?: (route: string, kind: SidebarRouteKind) => void;
}

// ✅ `Hub` removed: there is no Hub screen registered anywhere in
// the navigators yet, so listing it here only produced a dead link.
// Add it back (with kind: 'stack' or 'tab' as appropriate) once the
// screen actually exists.
const NAV_ITEMS: SidebarNavItem[] = [
  { name: 'Discover', icon: 'compass', route: 'Discover', kind: 'tab' },
  { name: 'Search', icon: 'search-outline', route: 'Search', kind: 'stack' },
  {
    name: 'Explore',
    icon: 'compass-outline',
    route: 'Explore',
    kind: 'tab',
  },
  { name: 'Pay', icon: 'card-outline', route: 'Pay', kind: 'tab' },
  { name: 'Inbox', icon: 'chatbubbles-outline', route: 'Inbox', kind: 'tab' },
  { name: 'Account', icon: 'person-outline', route: 'Account', kind: 'tab' },
];

export function Sidebar({ currentRoute, onNavigate }: Props) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {NAV_ITEMS.map((item) => {
        const active = currentRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={[styles.navItem, active && styles.navItemActive]}
            onPress={() => onNavigate?.(item.route, item.kind)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={item.icon as any}
              size={24}
              color={active ? '#4A7DFF' : '#8A8AAE'}
            />
            <Text style={[styles.navText, active && styles.navTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#0D0D1A',
    paddingVertical: 24,
    borderRightWidth: 1,
    borderRightColor: '#0D0D1A',
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