import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        setStatus('Error: ' + error.message);
      } else {
        setStatus('✅ Connected! Tables are ready. Users: ' + data.length);
      }
    }
    test();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  text: { fontSize: 18, color: '#212121', padding: 20, textAlign: 'center' },
});