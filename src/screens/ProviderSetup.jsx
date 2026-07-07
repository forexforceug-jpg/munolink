import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function ProviderSetup({ navigation, route }) {
  const phoneNumber = route?.params?.phoneNumber;
  const role = route?.params?.role || 'service_provider';
  const { user, login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [profession, setProfession] = useState('Plumbing');
  const [experience, setExperience] = useState('');
  const [area, setArea] = useState('Jinja');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const professions = ['Plumbing', 'Electrical', 'Cleaning', 'Beauty', 'Tutoring', 'Healthcare', 'Transport', 'Events', 'Photography', 'Tech/IT', 'Other'];

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setLoading(true);

    // Update user profile
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: fullName.trim(),
        role: 'service_provider',
      })
      .eq('phone_number', phoneNumber);

    if (userError) {
      Alert.alert('Error', 'Failed to update profile.');
      setLoading(false);
      return;
    }

    setLoading(false);

    // Update context
    login({ ...user, fullName: fullName.trim(), role: 'service_provider', profession });

    // Navigate directly to dashboard
    navigation.replace('ServiceProviderDashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>MUNOLINK</Text>
          <Text style={styles.tagline}>For Better Connections</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Set Up Your Profile</Text>
        <Text style={styles.pageSubtitle}>Tell us about your services so customers can find and book you.</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="e.g. John Mukasa" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Profession</Text>
        <View style={styles.chipRow}>
          {professions.map((prof) => (
            <TouchableOpacity key={prof} style={[styles.chip, profession === prof && styles.chipActive]} onPress={() => setProfession(prof)}>
              <Text style={[styles.chipText, profession === prof && styles.chipTextActive]}>{prof}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Years of Experience</Text>
        <TextInput style={styles.input} value={experience} onChangeText={setExperience} keyboardType="numeric" placeholder="e.g. 5" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Area Served</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="e.g. Jinja City" placeholderTextColor="#CCC" />

        <Text style={styles.label}>Short Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={4} placeholder="Describe your services and experience..." placeholderTextColor="#CCC" />

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading}>
          <Ionicons name="briefcase-outline" size={20} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>{loading ? 'Creating Profile...' : 'Create My Profile'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 12 },
  headerCenter: { alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#006B3F', letterSpacing: 2 },
  tagline: { fontSize: 9, color: '#888' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#212121', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F8F8F8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#212121', borderWidth: 1, borderColor: '#ECECEC' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#006B3F', borderColor: '#006B3F' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  chipTextActive: { color: '#FFFFFF' },
  submitBtn: { flexDirection: 'row', backgroundColor: '#006B3F', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});