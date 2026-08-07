import React, { ReactNode } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

interface Props {
  children: ReactNode;
  maxWidth?: number;
}

export function CenteredFeedContainer({ children, maxWidth = 480 }: Props) {
  const { width } = useWindowDimensions();
  
  // Calculate padding to center the content
  const paddingHorizontal = Math.max((width - maxWidth) / 2, 24);
  
  return (
    <View style={[styles.container, { paddingHorizontal }]}>
      <View style={[styles.content, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});