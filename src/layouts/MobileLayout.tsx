// src/layouts/MobileLayout.tsx

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenShell } from '../utils/screenShell';

interface Props {
  children: ReactNode;
  floatingActions?: ReactNode;
}

export function MobileLayout({ children, floatingActions }: Props) {
  return (
    <ScreenShell backgroundColor="#1F2F5F">
      <View style={styles.content}>{children}</View>

      {floatingActions && (
        <View
          style={styles.floatingActionsContainer}
          pointerEvents="box-none"
        >
          {floatingActions}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 120,
    paddingRight: 16,
  },
});