import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

interface Props {
  children: ReactNode;
  floatingActions?: ReactNode;
}

export function MobileLayout({ children, floatingActions }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
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
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  floatingActionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    pointerEvents: 'box-none',
    // ✅ Add flex to position items at bottom-right
    justifyContent: 'flex-end',  // Push content to bottom
    alignItems: 'flex-end',      // Push content to right
    paddingBottom: 120,          // Adjust this value to move up/down
    paddingRight: 16,            // Distance from right edge
  },
});