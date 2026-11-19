// src/components/Sidebar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useStyledAlert } from '../features/feed/components/StyledAlert';

export type SidebarRouteKind = 'tab' | 'stack';

export interface SidebarNavItem {
  name: string;
  icon: string;
  route: string;
  kind: SidebarRouteKind;
}

interface Props {
  currentRoute?: string;
  searchExpanded?: boolean;
  onNavigate?: (route: string, kind: SidebarRouteKind) => void;
  onLogout?: () => void;
}

// ✅ `Hub` removed: there is no Hub screen registered anywhere in
// the navigators yet, so listing it here only produced a dead link.
// Add it back (with kind: 'stack' or 'tab' as appropriate) once the
// screen actually exists.
const NAV_ITEMS: SidebarNavItem[] = [
  { name: 'Search', icon: 'search-outline', route: 'Search', kind: 'stack' },
  { name: 'Discover', icon: 'compass', route: 'Discover', kind: 'tab' },
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

const FOOTER_ITEMS: SidebarNavItem[] = [
  {
    name: 'Terms of Service',
    icon: 'document-text-outline',
    route: 'TermsOfService',
    kind: 'stack',
  },
  {
    name: 'Privacy Policy',
    icon: 'shield-checkmark-outline',
    route: 'PrivacyPolicy',
    kind: 'stack',
  },
];

export function Sidebar({
  currentRoute,
  searchExpanded = false,
  onNavigate,
  onLogout,
}: Props) {
  const { logout } = useAuth();
  const { show, hide, element } = useStyledAlert();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    show({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      icon: 'log-out-outline',
      iconColor: '#E74C3C',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hide },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            hide();
            try {
              await logout();
              onNavigate?.('Join', 'stack');
            } catch (error) {
              console.error('Logout error:', error);
              show({
                title: 'Error',
                message: 'Failed to log out. Please try again.',
                icon: 'alert-circle-outline',
                iconColor: '#E74C3C',
                buttons: [{ text: 'OK', style: 'primary', onPress: hide }],
              });
            }
          },
        },
      ],
    });
  };

  return (
    <View
      style={[
        styles.sidebar,
        searchExpanded && styles.sidebarCollapsed,
      ]}
    >
      <View
        style={[
          styles.logoContainer,
          searchExpanded && styles.logoContainerCollapsed,
        ]}
      >
        <Image
          source={
            searchExpanded
              ? require('../../assets/favicon.png')
              : require('../../assets/logo.png')
          }
          style={[
            styles.logoImage,
            searchExpanded && styles.logoImageCollapsed,
          ]}
          resizeMode="contain"
        />
      </View>

      {!searchExpanded && (
        <TouchableOpacity
          style={styles.searchField}
          onPress={() => onNavigate?.('Search', 'stack')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <View style={styles.searchFieldContent} pointerEvents="none">
            <Ionicons name="search-outline" size={18} color="#A0A1A5" />
            <Text style={styles.searchFieldPlaceholder}>Search</Text>
          </View>
        </TouchableOpacity>
      )}

      <View>
        {NAV_ITEMS.map((item) => {
          if (item.route === 'Search' && !searchExpanded) return null;
          const active = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.navItem,
                searchExpanded && styles.navItemCollapsed,
                active && styles.navItemActive,
              ]}
              onPress={() => onNavigate?.(item.route, item.kind)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                color={active ? '#FFFFFF' : '#A0A1A5'}
              />
              {!searchExpanded && (
                <Text style={[styles.navText, active && styles.navTextActive]}>
                  {item.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarSpacer} />

      <View style={styles.footer}>
        {FOOTER_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[
              styles.footerItem,
              searchExpanded && styles.footerItemCollapsed,
            ]}
            onPress={() => onNavigate?.(item.route, item.kind)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <Ionicons name={item.icon as any} size={19} color="#A0A1A5" />
            {!searchExpanded && (
              <Text style={styles.footerText}>{item.name}</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.footerItem,
            styles.logoutItem,
            searchExpanded && styles.footerItemCollapsed,
          ]}
          onPress={handleLogout}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={19} color="#FF7777" />
          {!searchExpanded && <Text style={styles.logoutText}>Log out</Text>}
        </TouchableOpacity>
      </View>
      {!onLogout && element}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    backgroundColor: '#101113',
    paddingVertical: 24,
    borderRightWidth: 1,
    borderRightColor: '#252629',
    flexDirection: 'column',
  },
  sidebarCollapsed: {
    width: 64,
    paddingVertical: 12,
  },
  logoContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainerCollapsed: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  logoImage: {
    width: 150,
    height: 70,
  },
  logoImageCollapsed: {
    width: 40,
    height: 40,
  },
  searchField: {
    minHeight: 40,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    justifyContent: 'center',
    backgroundColor: '#222326',
  },
  searchFieldContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchFieldPlaceholder: {
    color: '#A0A1A5',
    fontSize: 13,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 9,
    marginHorizontal: 8,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#1B1C20',
    borderLeftWidth: 3,
    borderLeftColor: '#FFFFFF',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    width: 48,
    height: 48,
    marginHorizontal: 8,
    paddingHorizontal: 0,
    borderLeftWidth: 0,
    borderRadius: 12,
  },
  navText: {
    color: '#A0A1A5',
    fontSize: 14,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sidebarSpacer: {
    flex: 1,
  },
  footer: {
    marginHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#252629',
  },
  footerItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
    paddingHorizontal: 8,
  },
  footerText: {
    color: '#A0A1A5',
    fontSize: 12,
    fontWeight: '500',
  },
  logoutItem: {
    marginTop: 6,
  },
  logoutText: {
    color: '#FF7777',
    fontSize: 12,
    fontWeight: '600',
  },
});