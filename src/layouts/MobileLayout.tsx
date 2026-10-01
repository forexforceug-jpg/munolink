// src/layouts/MobileLayout.tsx

import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View, Platform } from 'react-native';

interface Props {
  children: ReactNode;
  floatingActions?: ReactNode;
}

export function MobileLayout({ children, floatingActions }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{children}</View>
      {floatingActions && (
        <View style={styles.floatingActionsContainer} pointerEvents="box-none">
          {floatingActions}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2F5F',
    // ✅ On web, lock the layout to the viewport so `position: absolute`
    // children (top bar, tab bar) are positioned relative to the screen,
    // not the scrolling document.
    ...Platform.select({
      web: {
        height: '100vh' as any,
        maxHeight: '100vh' as any,
        overflow: 'hidden',
        position: 'relative' as any,
      },
      default: {},
    }),
  },
  content: {
    flex: 1,
    position: 'relative',
    // ✅ Prevent the FlatList from growing the parent past the viewport.
    ...Platform.select({
      web: {
        minHeight: 0,
        overflow: 'hidden',
      },
      default: {},
    }),
  },
  floatingActionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'box-none',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 120,
    paddingRight: 16,
  },
});