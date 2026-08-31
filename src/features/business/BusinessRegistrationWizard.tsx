// src/features/business/BusinessRegistrationWizard.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Json } from '../../types/database.types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ResponsiveLayout } from '../../layouts/ResponsiveLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const { width, height } = Dimensions.get('window');

// --- Types ---
type BusinessDocumentInsert = {
  business_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_data?: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  status?: string;
  is_verified?: boolean;
};

// --- Business Types ---
const BUSINESS_TYPES = [
  { id: 'shop', icon: 'storefront-outline', label: 'Shop', description: 'Sell products to customers', color: '#4A7DFF' },
  { id: 'institution', icon: 'business-outline', label: 'Institution', description: 'Hotel, School, Hospital, etc.', color: '#00B894' },
  { id: 'individual', icon: 'person-outline', label: 'Individual Provider', description: 'Freelancer, Consultant, Professional', color: '#F39C12' },
];

// --- Category Mappings ---
const CATEGORIES: Record<string, any[]> = {
  shop: [
    { id: 'electronics', icon: 'phone-portrait-outline', label: 'Electronics', color: '#4A7DFF' },
    { id: 'fashion', icon: 'shirt-outline', label: 'Fashion', color: '#E84393' },
    { id: 'restaurant', icon: 'restaurant-outline', label: 'Restaurant', color: '#FDCB6E' },
    { id: 'furniture', icon: 'bed-outline', label: 'Furniture', color: '#6C5CE7' },
    { id: 'hardware', icon: 'construct-outline', label: 'Hardware', color: '#F39C12' },
    { id: 'pharmacy', icon: 'medical-outline', label: 'Pharmacy', color: '#00B894' },
    { id: 'grocery', icon: 'cart-outline', label: 'Grocery', color: '#55EFC4' },
    { id: 'supermarket', icon: 'storefront-outline', label: 'Supermarket', color: '#FD79A8' },
    { id: 'books', icon: 'book-outline', label: 'Books', color: '#6C5CE7' },
    { id: 'jewelry', icon: 'diamond-outline', label: 'Jewelry', color: '#FDCB6E' },
    { id: 'art', icon: 'color-palette-outline', label: 'Art & Crafts', color: '#E17055' },
  ],
  institution: [
    { id: 'hospital', icon: 'medical-outline', label: 'Hospital', color: '#00B894' },
    { id: 'school', icon: 'school-outline', label: 'School', color: '#4A7DFF' },
    { id: 'hotel', icon: 'bed-outline', label: 'Hotel', color: '#FDCB6E' },
    { id: 'restaurant', icon: 'restaurant-outline', label: 'Restaurant', color: '#E17055' },
    { id: 'bank', icon: 'business-outline', label: 'Bank', color: '#6C5CE7' },
    { id: 'ngo', icon: 'people-outline', label: 'NGO', color: '#55EFC4' },
  ],
  individual: [
    { id: 'freelancer', icon: 'laptop-outline', label: 'Freelancer', color: '#6C5CE7' },
    { id: 'consultant', icon: 'briefcase-outline', label: 'Consultant', color: '#4A7DFF' },
    { id: 'photographer', icon: 'camera-outline', label: 'Photographer', color: '#FDCB6E' },
    { id: 'videographer', icon: 'videocam-outline', label: 'Videographer', color: '#E17055' },
    { id: 'graphic_designer', icon: 'color-palette-outline', label: 'Graphic Designer', color: '#6C5CE7' },
    { id: 'web_developer', icon: 'code-outline', label: 'Web Developer', color: '#00B894' },
    { id: 'writer', icon: 'create-outline', label: 'Writer', color: '#FDCB6E' },
    { id: 'translator', icon: 'language-outline', label: 'Translator', color: '#E84393' },
    { id: 'musician', icon: 'musical-notes-outline', label: 'Musician', color: '#6C5CE7' },
    { id: 'artist', icon: 'color-palette-outline', label: 'Artist', color: '#E17055' },
    { id: 'tutor', icon: 'school-outline', label: 'Tutor', color: '#4A7DFF' },
    { id: 'coach', icon: 'fitness-outline', label: 'Coach', color: '#F39C12' },
    { id: 'mechanic', icon: 'construct-outline', label: 'Mechanic', color: '#00B894' },
    { id: 'electrician', icon: 'flash-outline', label: 'Electrician', color: '#FDCB6E' },
    { id: 'plumber', icon: 'water-outline', label: 'Plumber', color: '#E84393' },
    { id: 'painter', icon: 'color-palette-outline', label: 'Painter', color: '#6C5CE7' },
    { id: 'cleaner', icon: 'sparkles-outline', label: 'Cleaner', color: '#4A7DFF' },
    { id: 'driver', icon: 'car-outline', label: 'Driver', color: '#F39C12' },
    { id: 'cook', icon: 'restaurant-outline', label: 'Cook', color: '#E17055' },
    { id: 'tailor', icon: 'shirt-outline', label: 'Tailor', color: '#6C5CE7' },
    { id: 'hairdresser', icon: 'cut-outline', label: 'Hairdresser', color: '#E84393' },
    { id: 'masseuse', icon: 'body-outline', label: 'Masuse', color: '#00B894' },
    { id: 'nurse', icon: 'medical-outline', label: 'Nurse', color: '#4A7DFF' },
    { id: 'accountant', icon: 'calculator-outline', label: 'Accountant', color: '#FDCB6E' },
    { id: 'lawyer', icon: 'scale-outline', label: 'Lawyer', color: '#6C5CE7' },
  ],
};

// --- Location Data ---
const DISTRICTS = [
  'Kampala', 'Jinja', 'Entebbe', 'Mukono', 'Gulu', 'Mbarara', 
  'Masaka', 'Mbale', 'Fort Portal', 'Arua', 'Lira', 'Soroti',
  'Busia', 'Tororo', 'Iganga', 'Kamuli', 'Kayunga', 'Luwero'
];

// ============================================================
// UI COMPONENTS
// ============================================================

// --- Custom Step Icon ---
const StepIcon = ({ icon, step, total, isDesktop }: any) => {
  const getColor = () => {
    if (step === total) return '#2ECC71';
    return '#4A7DFF';
  };

  return (
    <View style={[styles.customStepIcon, isDesktop && styles.customStepIconDesktop]}>
      <LinearGradient
        colors={[getColor(), getColor() + 'CC']}
        style={styles.customStepIconGradient}
      >
        <Ionicons name={icon} size={32} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
};

// --- Customizable Business Type Card ---
const CustomBusinessTypeCard = ({ item, selected, onPress, isDesktop }: any) => (
  <TouchableOpacity
    style={[
      styles.customBusinessCard,
      isDesktop && styles.customBusinessCardDesktop,
      selected && styles.customBusinessCardSelected,
      { borderColor: selected ? item.color : 'transparent' }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={selected ? [item.color, item.color + 'CC'] : ['#F8F9FC', '#F8F9FC']}
      style={styles.customBusinessCardGradient}
    >
      <View style={[
        styles.customBusinessIconContainer,
        { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : 'rgba(74,125,255,0.1)' }
      ]}>
        <Ionicons name={item.icon} size={28} color={selected ? '#FFFFFF' : '#4A7DFF'} />
      </View>
      <Text style={[
        styles.customBusinessLabel,
        { color: selected ? '#FFFFFF' : '#1F2F5F' }
      ]}>{item.label}</Text>
      <Text style={[
        styles.customBusinessDescription,
        { color: selected ? 'rgba(255,255,255,0.8)' : '#8A8AAE' }
      ]}>{item.description}</Text>
      {selected && (
        <View style={styles.customBusinessCheck}>
          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
        </View>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

// --- Customizable Category Card ---
const CustomCategoryCard = ({ item, selected, onPress, isDesktop }: any) => (
  <TouchableOpacity
    style={[
      styles.customCategoryCard,
      isDesktop && styles.customCategoryCardDesktop,
      selected && styles.customCategoryCardSelected,
      { borderColor: selected ? item.color : 'transparent' }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[
      styles.customCategoryIconContainer,
      { backgroundColor: selected ? item.color : 'rgba(74,125,255,0.08)' }
    ]}>
      <Ionicons name={item.icon} size={24} color={selected ? '#FFFFFF' : item.color} />
    </View>
    <Text style={[
      styles.customCategoryLabel,
      { color: selected ? item.color : '#1F2F5F' }
    ]}>{item.label}</Text>
    {selected && (
      <View style={styles.customCategoryCheck}>
        <Ionicons name="checkmark-circle" size={20} color={item.color} />
      </View>
    )}
  </TouchableOpacity>
);

// --- Select Component ---
const Select = ({ options, selected, onSelect, placeholder }: any) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity
        style={styles.selectTrigger}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selected ? styles.selectText : styles.selectPlaceholder}>
          {selected || placeholder || 'Select an option'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#8A8AAE" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select an Option</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1F2F5F" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selected === item && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                  {selected === item && (
                    <Ionicons name="checkmark" size={20} color="#4A7DFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Step Indicator ---
const CustomStepIndicator = ({ currentStep, totalSteps, isDesktop }: any) => (
  <View style={[styles.customStepIndicatorContainer, isDesktop && styles.customStepIndicatorDesktop]}>
    {Array.from({ length: totalSteps }).map((_, i) => (
      <View key={i} style={styles.customStepIndicatorItem}>
        <View
          style={[
            styles.customStepDot,
            i === currentStep && styles.customStepDotActive,
            i < currentStep && styles.customStepDotCompleted,
          ]}
        />
        {i < totalSteps - 1 && (
          <View style={[
            styles.customStepLine,
            i < currentStep && styles.customStepLineCompleted,
          ]} />
        )}
      </View>
    ))}
  </View>
);

// --- Main Component ---
const BusinessRegistrationWizardContent = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 3 fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [price, setPrice] = useState('');
  
  // Individual Provider fields
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // --- Navigation ---
  const nextStep = () => {
    if (step === 1 && !businessType) {
      Alert.alert('Please select a business type');
      return;
    }
    if (step === 2 && !category) {
      Alert.alert('Please select a category');
      return;
    }
    if (step === 3 && !businessName.trim()) {
      Alert.alert('Please enter your business name');
      return;
    }
    if (step === 3 && !district) {
      Alert.alert('Please select your district');
      return;
    }
    // Validate individual provider fields
    if (step === 3 && businessType === 'individual') {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert('Please enter your first and last name');
        return;
      }
      if (!phone.trim()) {
        Alert.alert('Please enter your phone number');
        return;
      }
      if (!email.trim()) {
        Alert.alert('Please enter your email address');
        return;
      }
      if (!price || parseFloat(price) <= 0) {
        Alert.alert('Please enter a valid price');
        return;
      }
    }
    setStep(step + 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // --- Handle Submit ---
  const handleSubmit = async () => {
    console.log('🚀 Starting business registration...');
    
    const userId = user?.id;
    const userPhone = user?.phone || '';
    
    if (!userId) {
      console.error('❌ No user ID available');
      Alert.alert(
        'Sign in required', 
        'Please sign in first.',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
      return;
    }

    if (!businessType || !category) {
      Alert.alert('Missing information', 'Please select a business type and category.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Creating business for user:', userId);

      // Ensure user exists
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!userById) {
        const fullName = businessType === 'individual' ? `${firstName.trim()} ${lastName.trim()}` : (user?.full_name || 'Munolink Member');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone_number: userPhone || '',
            full_name: fullName,
            role: businessType === 'shop' ? 'shop_owner' : 
                  businessType === 'institution' ? 'institution_representative' :
                  'individual_provider',
            wallet_balance: 0,
            lifetime_savings: 0,
            kyc_verified: false,
          });

        if (createUserError) throw createUserError;
        console.log('✅ User created in users table');
      }

      let businessId: string | null = null;

      // ============================================================
      // SAVE TO RESPECTIVE TABLES
      // ============================================================

      if (businessType === 'shop') {
        // ✅ Save to SHOPS table
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .insert({
            owner_id: userId,
            name: businessName.trim(),
            area: district || null,
            address: address || null,
            description: businessDescription.trim() || null,
            category: category,
            phone: phone || null,
            business_type: 'shop',
            business_settings: {},
            is_active: false,
            is_verified: false,
            rating: 0,
            review_count: 0,
            district: district || null,
          })
          .select('id')
          .single();

        if (shopError) throw shopError;
        businessId = shopData.id;
        console.log('✅ Shop created with ID:', businessId);

      } else if (businessType === 'institution') {
        // ✅ Save to INSTITUTIONS table
        const { data: institutionData, error: institutionError } = await supabase
          .from('institutions')
          .insert({
            name: businessName.trim(),
            area: district || null,
            address: address || null,
            description: businessDescription.trim() || null,
            type: category,
            city: district || null,
            phone: phone || null,
            email: email || null,
            website: website || null,
            is_open: true,
            is_verified: false,
            rating: 0,
            review_count: 0,
            created_by: userId,
            working_hours: {},
          })
          .select('id')
          .single();

        if (institutionError) throw institutionError;
        businessId = institutionData.id;
        console.log('✅ Institution created with ID:', businessId);

      } else if (businessType === 'individual') {
        // ✅ Save to INDIVIDUAL_PROVIDERS table
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const displayName = businessName.trim() || fullName;

        const { data: providerData, error: providerError } = await supabase
          .from('individual_providers')
          .insert({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            display_name: displayName,
            specialty: category,
            profession: profession || category,
            experience_years: experience ? parseInt(experience) : null,
            email: email.trim(),
            phone: phone.trim(),
            address: address || null,
            city: district || null,
            country: 'Uganda',
            bio: businessDescription.trim() || null,
            rating: 0,
            review_count: 0,
            is_active: true,
            is_verified: false,
            is_available_for_hire: true,
            created_by: userId,
          })
          .select('id')
          .single();

        if (providerError) {
          console.error('❌ Individual provider insert error:', providerError);
          throw providerError;
        }
        businessId = providerData.id;
        console.log('✅ Individual provider created with ID:', businessId);
      }

      if (!businessId) {
        throw new Error('Failed to create business record');
      }

      // ============================================================
      // UPDATE USER ROLE
      // ============================================================
      const userRole = businessType === 'shop' ? 'shop_owner' : 
                       businessType === 'institution' ? 'institution_representative' :
                       'individual_provider';
      
      await supabase
        .from('users')
        .update({ role: userRole })
        .eq('id', userId);

      console.log('✅ Registration complete! Business ID:', businessId);

      setStep(4);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();

    } catch (error: any) {
      console.error('❌ REGISTRATION ERROR:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    console.log('👆 Navigating to dashboard...');
    try {
      navigation.replace('BusinessDashboard');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', 'Could not navigate to dashboard. Please restart the app.');
    }
  };

  // --- Render Step 1: Business Type ---
  const renderStep1 = () => (
    <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
      <StepIcon icon="rocket-outline" step={1} total={4} isDesktop={isDesktop} />
      
      <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
        What kind of business are you starting?
      </Text>
      <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
        Choose the type that best describes your business
      </Text>

      <View style={[styles.customBusinessGrid, isDesktop && styles.customBusinessGridDesktop]}>
        {BUSINESS_TYPES.map((type) => (
          <CustomBusinessTypeCard
            key={type.id}
            item={type}
            selected={businessType === type.id}
            onPress={() => setBusinessType(type.id)}
            isDesktop={isDesktop}
          />
        ))}
      </View>
    </View>
  );

  // --- Render Step 2: Category ---
  const renderStep2 = () => {
    const categories = businessType ? CATEGORIES[businessType] || [] : [];

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <StepIcon icon="grid-outline" step={2} total={4} isDesktop={isDesktop} />
        
        <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
          Great! What do you specialize in?
        </Text>
        <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
          Choose the category that best fits your business
        </Text>

        <View style={[styles.customCategoryGrid, isDesktop && styles.customCategoryGridDesktop]}>
          {categories.map((cat) => (
            <CustomCategoryCard
              key={cat.id}
              item={cat}
              selected={category === cat.id}
              onPress={() => setCategory(cat.id)}
              isDesktop={isDesktop}
            />
          ))}
        </View>
      </View>
    );
  };

  // --- Render Step 3: Business Identity ---
  const renderStep3 = () => {
    const isIndividual = businessType === 'individual';
    const isShop = businessType === 'shop';
    const isInstitution = businessType === 'institution';

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <StepIcon icon="person-outline" step={3} total={4} isDesktop={isDesktop} />
        
        <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
          {isIndividual ? 'Tell us about yourself' : 'Tell us about your business'}
        </Text>
        <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
          {isIndividual 
            ? 'Just a few details about you as an individual provider' 
            : 'Just a few details about your business'}
        </Text>

        <View style={[styles.customFormContainer, isDesktop && styles.customFormContainerDesktop]}>

          {/* ============================================================
              INDIVIDUAL PROVIDERS - First & Last Name (Required)
              ============================================================ */}
          {isIndividual && (
            <View style={styles.customFormRow}>
              <View style={[styles.customFormGroup, styles.customFormGroupHalf]}>
                <Text style={styles.customFormLabel}>First Name *</Text>
                <TextInput
                  style={styles.customFormInput}
                  placeholder="e.g. Alex"
                  placeholderTextColor="#8A8AAE"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.customFormGroup, styles.customFormGroupHalf]}>
                <Text style={styles.customFormLabel}>Last Name *</Text>
                <TextInput
                  style={styles.customFormInput}
                  placeholder="e.g. Mukasa"
                  placeholderTextColor="#8A8AAE"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>
          )}

          {/* ============================================================
              DISPLAY NAME - All Business Types
              ============================================================ */}
          <View style={styles.customFormGroup}>
            <Text style={styles.customFormLabel}>
              {isIndividual ? 'Display Name *' : 'Business Name *'}
            </Text>
            <TextInput
              style={styles.customFormInput}
              placeholder={isIndividual 
                ? "e.g. Alex Mukasa - Electrician" 
                : "e.g. TechWorld Kampala"}
              placeholderTextColor="#8A8AAE"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* ============================================================
              PHONE NUMBER - All Business Types
              ============================================================ */}
          <View style={styles.customFormGroup}>
            <Text style={styles.customFormLabel}>Phone Number *</Text>
            <TextInput
              style={styles.customFormInput}
              placeholder="+256 700 000 000"
              placeholderTextColor="#8A8AAE"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* ============================================================
              EMAIL - Individual & Institution
              ============================================================ */}
          {(isIndividual || isInstitution) && (
            <View style={styles.customFormGroup}>
              <Text style={styles.customFormLabel}>
                Email {isIndividual ? '*' : '(Optional)'}
              </Text>
              <TextInput
                style={styles.customFormInput}
                placeholder="info@yourbusiness.com"
                placeholderTextColor="#8A8AAE"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          )}

          {/* ============================================================
              WEBSITE - Institutions Only
              ============================================================ */}
          {isInstitution && (
            <View style={styles.customFormGroup}>
              <Text style={styles.customFormLabel}>Website (Optional)</Text>
              <TextInput
                style={styles.customFormInput}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#8A8AAE"
                autoCapitalize="none"
                value={website}
                onChangeText={setWebsite}
              />
            </View>
          )}

          {/* ============================================================
              ADDRESS - All Business Types (Optional)
              ============================================================ */}
          <View style={styles.customFormGroup}>
            <Text style={styles.customFormLabel}>Address (Optional)</Text>
            <TextInput
              style={styles.customFormInput}
              placeholder="e.g. 123 Main Street, Jinja"
              placeholderTextColor="#8A8AAE"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* ============================================================
              DISTRICT - All Business Types (Required)
              ============================================================ */}
          <View style={styles.customFormGroup}>
            <Text style={styles.customFormLabel}>District *</Text>
            <Select
              options={DISTRICTS}
              selected={district || ''}
              onSelect={(value: string) => setDistrict(value)}
              placeholder="Select your district"
            />
          </View>

          {/* ============================================================
              DESCRIPTION - All Business Types (Optional)
              ============================================================ */}
          <View style={styles.customFormGroup}>
            <Text style={styles.customFormLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.customFormInput, styles.customFormTextArea]}
              placeholder={isIndividual 
                ? "Tell customers about your skills and experience..." 
                : "Tell customers about your business..."}
              placeholderTextColor="#8A8AAE"
              multiline
              numberOfLines={3}
              value={businessDescription}
              onChangeText={setBusinessDescription}
            />
          </View>

          {/* ============================================================
              PRICE - Individual Only
              ============================================================ */}
          {isIndividual && (
            <View style={styles.customFormGroup}>
              <Text style={styles.customFormLabel}>Starting Price (UGX) *</Text>
              <TextInput
                style={styles.customFormInput}
                placeholder="e.g. 50000"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          )}

          {/* ============================================================
              PROFESSION - Individual Providers Only
              ============================================================ */}
          {isIndividual && (
            <View style={styles.customFormGroup}>
              <Text style={styles.customFormLabel}>Profession *</Text>
              <TextInput
                style={styles.customFormInput}
                placeholder="e.g. Electrician, Photographer, Developer"
                placeholderTextColor="#8A8AAE"
                value={profession}
                onChangeText={setProfession}
              />
            </View>
          )}

          {/* ============================================================
              EXPERIENCE - Individual Providers Only
              ============================================================ */}
          {isIndividual && (
            <View style={styles.customFormGroup}>
              <Text style={styles.customFormLabel}>Years of Experience</Text>
              <TextInput
                style={styles.customFormInput}
                placeholder="e.g. 5"
                placeholderTextColor="#8A8AAE"
                keyboardType="numeric"
                value={experience}
                onChangeText={setExperience}
              />
            </View>
          )}

        </View>
      </View>
    );
  };

  // --- Render Step 4: Success ---
  const renderSuccess = () => (
    <Animated.View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop, { opacity: fadeAnim }]}>
      <View style={styles.customSuccessContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.customSuccessGradient}
        >
          <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>

      <Text style={styles.customSuccessTitle}>Business Created!</Text>
      <Text style={styles.customSuccessSubtitle}>
        {businessName} is now registered on Munolink.
      </Text>

      <View style={[styles.customSuccessFeatures, isDesktop && styles.customSuccessFeaturesDesktop]}>
        <View style={styles.customSuccessFeature}>
          <View style={styles.customSuccessFeatureIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
          </View>
          <View>
            <Text style={styles.customSuccessFeatureTitle}>Profile Created</Text>
            <Text style={styles.customSuccessFeatureDesc}>
              Your business profile is ready to be customized
            </Text>
          </View>
        </View>

        <View style={styles.customSuccessFeature}>
          <View style={styles.customSuccessFeatureIcon}>
            <Ionicons name="time-outline" size={24} color="#F1C40F" />
          </View>
          <View>
            <Text style={styles.customSuccessFeatureTitle}>Complete Your Profile</Text>
            <Text style={styles.customSuccessFeatureDesc}>
              Upload documents and add details in your dashboard
            </Text>
          </View>
        </View>

        <View style={styles.customSuccessFeature}>
          <View style={styles.customSuccessFeatureIcon}>
            <Ionicons name="rocket-outline" size={24} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.customSuccessFeatureTitle}>Start Selling</Text>
            <Text style={styles.customSuccessFeatureDesc}>
              Add your first product or service today
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.customDashboardButton} onPress={handleFinish}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.customDashboardGradient}
        >
          <Text style={styles.customDashboardButtonText}>Go to Dashboard</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  // --- Render Current Step ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderSuccess();
      default:
        return null;
    }
  };

  const totalSteps = 4;

  return (
    <SafeAreaView style={[styles.container, isDesktop && styles.containerDesktop]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, isDesktop && styles.headerDesktop]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2F5F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step <= 3 ? `Step ${step} of ${totalSteps}` : 'Complete!'}
          </Text>
          {step < 4 && (
            <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {step < 4 && (
          <CustomStepIndicator 
            currentStep={step - 1} 
            totalSteps={totalSteps - 1} 
            isDesktop={isDesktop}
          />
        )}

        <ScrollView
          ref={scrollViewRef}
          style={[styles.content, isDesktop && styles.contentDesktop]}
          contentContainerStyle={[styles.contentContainer, isDesktop && styles.contentContainerDesktop]}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {step < 4 && (
          <View style={[styles.navigationBar, isDesktop && styles.navigationBarDesktop]}>
            {step > 1 ? (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <Text style={styles.prevButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.prevButtonPlaceholder} />
            )}
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={step === 3 ? handleSubmit : nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {step === 3 ? 'Create Business' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Main Component ---
export const BusinessRegistrationWizard = ({ navigation }: any) => {
  const { isDesktop } = useBreakpoint();

  return (
    <ResponsiveLayout 
      currentRoute="BusinessRegistration" 
      onNavigate={(route) => navigation?.navigate(route)}
      floatingActions={null}
      hideContextPanel={true}
      fullWidth={true}
    >
      <BusinessRegistrationWizardContent navigation={navigation} />
    </ResponsiveLayout>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerDesktop: {
    backgroundColor: '#F8F9FC',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  skipButton: {
    padding: 4,
  },
  skipButtonText: {
    color: '#8A8AAE',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentDesktop: {
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  contentContainerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  stepContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  stepContainerDesktop: {
    paddingTop: 10,
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
  },
  navigationBarDesktop: {
    paddingHorizontal: 24,
  },
  prevButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  prevButtonText: {
    color: '#8A8AAE',
    fontSize: 15,
    fontWeight: '500',
  },
  prevButtonPlaceholder: {
    width: 80,
  },
  nextButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  selectContainer: {
    marginBottom: 4,
  },
  selectTrigger: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  selectText: {
    color: '#1F2F5F',
    fontSize: 15,
    flex: 1,
  },
  selectPlaceholder: {
    color: '#8A8AAE',
    fontSize: 15,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2F5F',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2F5F',
    flex: 1,
  },
  customStepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  customStepIndicatorDesktop: {
    paddingHorizontal: 80,
  },
  customStepIndicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customStepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E8ECF4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  customStepDotActive: {
    backgroundColor: '#4A7DFF',
    borderColor: '#4A7DFF',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  customStepDotCompleted: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  customStepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E8ECF4',
    marginHorizontal: 4,
  },
  customStepLineCompleted: {
    backgroundColor: '#2ECC71',
  },
  customStepIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  customStepIconDesktop: {
    marginBottom: 28,
  },
  customStepIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  customStepIconText: {
    fontSize: 36,
  },
  customStepTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  customStepTitleDesktop: {
    fontSize: 28,
  },
  customStepSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  customStepSubtitleDesktop: {
    fontSize: 16,
    marginBottom: 32,
  },
  customBusinessGrid: {
    gap: 12,
  },
  customBusinessGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  customBusinessCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  customBusinessCardDesktop: {
    width: (width - 120) / 3,
    minWidth: 220,
  },
  customBusinessCardSelected: {
    elevation: 4,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  customBusinessCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  customBusinessIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  customBusinessIcon: {
    fontSize: 28,
  },
  customBusinessLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customBusinessDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  customBusinessCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  customCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  customCategoryGridDesktop: {
    gap: 14,
  },
  customCategoryCard: {
    width: (width - 68) / 3,
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  customCategoryCardDesktop: {
    width: (width - 140) / 4,
    padding: 20,
  },
  customCategoryCardSelected: {
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customCategoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  customCategoryIcon: {
    fontSize: 24,
  },
  customCategoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  customCategoryCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  customFormContainer: {
    gap: 18,
  },
  customFormContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  customFormGroup: {
    gap: 6,
  },
  customFormRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customFormGroupHalf: {
    flex: 1,
  },
  customFormLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  customFormInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F2F5F',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  customFormTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  customSuccessContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  customSuccessGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  customSuccessEmoji: {
    fontSize: 48,
  },
  customSuccessTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  customSuccessSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  customSuccessFeatures: {
    gap: 12,
    marginBottom: 32,
  },
  customSuccessFeaturesDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  customSuccessFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customSuccessFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customSuccessFeatureTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  customSuccessFeatureDesc: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  customDashboardButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  customDashboardGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  customDashboardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});