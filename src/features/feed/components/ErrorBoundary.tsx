import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
  info: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('💥 ErrorBoundary caught:', error, info);
    this.setState({ info: info.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something crashed</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.stack}>{this.state.error?.stack}</Text>
            <Text style={styles.stack}>{this.state.info}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0D0D1A' },
  title: { color: '#FF6B6B', fontSize: 20, fontWeight: 'bold', marginTop: 40 },
  message: { color: '#FFFFFF', fontSize: 14, marginTop: 12 },
  scroll: { flex: 1, marginTop: 16 },
  stack: { color: '#8A8AAE', fontSize: 11, fontFamily: 'monospace' },
});