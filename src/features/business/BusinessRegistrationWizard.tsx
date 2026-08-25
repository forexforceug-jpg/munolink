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

// --- Business Types (Simplified) ---
const BUSINESS_TYPES = [
  { id: 'shop', icon: '🏪', label: 'Shop', description: 'Sell products to customers', color: '#4A7DFF' },
  { id: 'service', icon: '🔧', label: 'Service Provider', description: 'Offer services and appointments', color: '#6C5CE7' },
  { id: 'institution', icon: '🏨', label: 'Institution', description: 'Hotel, School, Hospital, etc.', color: '#00B894' },
];

// --- Category Mappings ---
const CATEGORIES: Record<string, any[]> = {
  shop: [
    { id: 'electronics', icon: '📱', label: 'Electronics', wizard: 'products', color: '#4A7DFF' },
    { id: 'fashion', icon: '👕', label: 'Fashion', wizard: 'products', color: '#E84393' },
    { id: 'restaurant', icon: '🍕', label: 'Restaurant', wizard: 'menu', color: '#FDCB6E' },
    { id: 'furniture', icon: '🛋️', label: 'Furniture', wizard: 'products', color: '#6C5CE7' },
    { id: 'hardware', icon: '🔨', label: 'Hardware', wizard: 'products', color: '#F39C12' },
    { id: 'pharmacy', icon: '💊', label: 'Pharmacy', wizard: 'products', color: '#00B894' },
    { id: 'grocery', icon: '🛒', label: 'Grocery', wizard: 'products', color: '#55EFC4' },
    { id: 'supermarket', icon: '🏪', label: 'Supermarket', wizard: 'products', color: '#FD79A8' },
    { id: 'books', icon: '📚', label: 'Books', wizard: 'products', color: '#6C5CE7' },
    { id: 'jewelry', icon: '💎', label: 'Jewelry', wizard: 'products', color: '#FDCB6E' },
    { id: 'art', icon: '🎨', label: 'Art & Crafts', wizard: 'products', color: '#E17055' },
  ],
  service: [
    { id: 'mechanic', icon: '🔧', label: 'Mechanic', wizard: 'services', color: '#4A7DFF' },
    { id: 'electrician', icon: '⚡', label: 'Electrician', wizard: 'services', color: '#F39C12' },
    { id: 'doctor', icon: '🏥', label: 'Doctor', wizard: 'services', color: '#00B894' },
    { id: 'lawyer', icon: '⚖️', label: 'Lawyer', wizard: 'services', color: '#6C5CE7' },
    { id: 'photographer', icon: '📸', label: 'Photographer', wizard: 'services', color: '#FDCB6E' },
    { id: 'interior_designer', icon: '🪑', label: 'Interior Designer', wizard: 'services', color: '#E84393' },
    { id: 'cleaner', icon: '🧹', label: 'Cleaner', wizard: 'services', color: '#55EFC4' },
    { id: 'tutor', icon: '📖', label: 'Tutor', wizard: 'services', color: '#6C5CE7' },
    { id: 'plumber', icon: '🔧', label: 'Plumber', wizard: 'services', color: '#F39C12' },
    { id: 'painter', icon: '🎨', label: 'Painter', wizard: 'services', color: '#E17055' },
    { id: 'consultant', icon: '💼', label: 'Consultant', wizard: 'services', color: '#4A7DFF' },
    { id: 'designer', icon: '🎨', label: 'Designer', wizard: 'services', color: '#6C5CE7' },
    { id: 'developer', icon: '💻', label: 'Developer', wizard: 'services', color: '#00B894' },
    { id: 'writer', icon: '✍️', label: 'Writer', wizard: 'services', color: '#FDCB6E' },
    { id: 'marketer', icon: '📈', label: 'Marketer', wizard: 'services', color: '#E84393' },
    { id: 'accountant', icon: '📊', label: 'Accountant', wizard: 'services', color: '#6C5CE7' },
  ],
  institution: [
    { id: 'hospital', icon: '🏥', label: 'Hospital', wizard: 'institution', color: '#00B894' },
    { id: 'school', icon: '🏫', label: 'School', wizard: 'institution', color: '#4A7DFF' },
    { id: 'hotel', icon: '🏨', label: 'Hotel', wizard: 'hotel', color: '#FDCB6E' },
    { id: 'restaurant', icon: '🍕', label: 'Restaurant', wizard: 'menu', color: '#E17055' },
    { id: 'bank', icon: '🏦', label: 'Bank', wizard: 'institution', color: '#6C5CE7' },
    { id: 'ngo', icon: '🤝', label: 'NGO', wizard: 'institution', color: '#55EFC4' },
  ],
};

// --- Dynamic Wizard Questions ---
const WIZARD_QUESTIONS: Record<string, any[]> = {
  products: [
    { 
      key: 'brands', 
      label: 'What brands do you sell?', 
      type: 'multiselect',
      options: ['Samsung', 'Apple', 'Nike', 'Adidas', 'Sony', 'LG', 'HP', 'Dell', 'Other'],
      placeholder: 'Select brands you sell',
      icon: '🏷️'
    },
    { 
      key: 'warranty', 
      label: 'Do you offer warranty?', 
      type: 'select', 
      options: ['Yes - 12 months', 'Yes - 24 months', 'No'],
      icon: '🛡️'
    },
    { 
      key: 'delivery', 
      label: 'Do you offer delivery?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'],
      icon: '🚚'
    },
    { 
      key: 'pickup', 
      label: 'Is in-store pickup available?', 
      type: 'select', 
      options: ['Yes', 'No'],
      icon: '🏪'
    },
    { 
      key: 'payment_methods', 
      label: 'Payment methods accepted?', 
      type: 'multiselect',
      options: ['Cash', 'Mobile Money', 'Bank Transfer', 'Card', 'Credit'],
      placeholder: 'Select payment methods',
      icon: '💳'
    },
  ],
  services: [
    { 
      key: 'service_type', 
      label: 'What type of services do you offer?', 
      type: 'multiselect',
      options: ['Repairs', 'Consultations', 'Installation', 'Maintenance', 'Training', 'Other'],
      placeholder: 'Select service types',
      icon: '🔧'
    },
    { 
      key: 'experience', 
      label: 'Years of experience?', 
      type: 'select',
      options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'],
      icon: '📅'
    },
    { 
      key: 'certification', 
      label: 'Do you have certifications?', 
      type: 'select', 
      options: ['Yes - Licensed', 'Yes - Certified', 'No'],
      icon: '🎓'
    },
    { 
      key: 'availability', 
      label: 'When are you available?', 
      type: 'multiselect',
      options: ['Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings', '24/7'],
      placeholder: 'Select availability',
      icon: '⏰'
    },
    { 
      key: 'service_area', 
      label: 'What areas do you cover?', 
      type: 'multiselect',
      options: ['Kampala', 'Jinja', 'Entebbe', 'Mukono', 'Gulu', 'Other'],
      placeholder: 'Select service areas',
      icon: '📍'
    },
  ],
  menu: [
    { 
      key: 'cuisine', 
      label: 'What type of cuisine?', 
      type: 'multiselect',
      options: ['Italian', 'Local', 'Chinese', 'Indian', 'Mexican', 'Fast Food', 'Other'],
      placeholder: 'Select cuisine types',
      icon: '🍽️'
    },
    { 
      key: 'delivery', 
      label: 'Do you offer delivery?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'],
      icon: '🚚'
    },
    { 
      key: 'reservations', 
      label: 'Do you accept reservations?', 
      type: 'select', 
      options: ['Yes', 'No'],
      icon: '📅'
    },
    { 
      key: 'dietary_options', 
      label: 'Dietary options available?', 
      type: 'multiselect',
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'None'],
      placeholder: 'Select dietary options',
      icon: '🥗'
    },
  ],
  hotel: [
    { 
      key: 'room_types', 
      label: 'What room types do you have?', 
      type: 'multiselect',
      options: ['Standard', 'Deluxe', 'Suite', 'Executive', 'Family', 'Dormitory'],
      placeholder: 'Select room types',
      icon: '🛏️'
    },
    { 
      key: 'amenities', 
      label: 'What amenities do you offer?', 
      type: 'multiselect',
      options: ['Pool', 'Gym', 'Restaurant', 'Spa', 'WiFi', 'Parking', 'Conference Room'],
      placeholder: 'Select amenities',
      icon: '🏊'
    },
    { 
      key: 'parking', 
      label: 'Do you offer parking?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'],
      icon: '🅿️'
    },
    { 
      key: 'check_in', 
      label: 'Check-in time?', 
      type: 'select',
      options: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 'Flexible'],
      icon: '🔑'
    },
    { 
      key: 'check_out', 
      label: 'Check-out time?', 
      type: 'select',
      options: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 'Flexible'],
      icon: '🚪'
    },
  ],
  institution: [
    { 
      key: 'service_type', 
      label: 'What services do you offer?', 
      type: 'multiselect',
      options: ['Education', 'Healthcare', 'Banking', 'Religious', 'Community', 'Other'],
      placeholder: 'Select service types',
      icon: '🏛️'
    },
    { 
      key: 'capacity', 
      label: 'What is your capacity?', 
      type: 'select',
      options: ['Small (1-50)', 'Medium (51-200)', 'Large (201-500)', 'Very Large (500+)'],
      icon: '👥'
    },
    { 
      key: 'certification', 
      label: 'Do you have certifications?', 
      type: 'select', 
      options: ['Yes - Licensed', 'Yes - Accredited', 'No'],
      icon: '📜'
    },
    { 
      key: 'operating_hours', 
      label: 'Operating hours?', 
      type: 'select',
      options: ['24/7', 'Weekdays only', 'Weekends only', 'Custom hours'],
      icon: '🕐'
    },
  ],
};

// --- Document Requirements by Business Type ---
const DOCUMENT_REQUIREMENTS: Record<string, Array<{ id: string; label: string; description: string; icon: string; required: boolean }>> = {
  shop: [
    { id: 'registration', label: 'Business Registration Certificate', description: 'Official registration document from the government', icon: 'document-text-outline', required: true },
    { id: 'tax', label: 'Tax Identification Number (TIN)', description: 'Your business tax registration document', icon: 'receipt-outline', required: true },
    { id: 'license', label: 'Trading License', description: 'Trading license or permit from local authorities', icon: 'shield-checkmark-outline', required: true },
    { id: 'logo', label: 'Business Logo', description: 'Your business logo or brand image', icon: 'image-outline', required: false },
  ],
  service: [
    { id: 'registration', label: 'Business Registration Certificate', description: 'Official registration document from the government', icon: 'document-text-outline', required: true },
    { id: 'tax', label: 'Tax Identification Number (TIN)', description: 'Your business tax registration document', icon: 'receipt-outline', required: true },
    { id: 'certification', label: 'Professional Certification', description: 'Professional or trade certification', icon: 'ribbon-outline', required: true },
    { id: 'license', label: 'Service License', description: 'Service provider license or permit', icon: 'shield-checkmark-outline', required: false },
  ],
  institution: [
    { id: 'registration', label: 'Registration Certificate', description: 'Official institution registration document', icon: 'document-text-outline', required: true },
    { id: 'tax', label: 'Tax Identification Number (TIN)', description: 'Your institution tax registration', icon: 'receipt-outline', required: true },
    { id: 'accreditation', label: 'Accreditation Certificate', description: 'Accreditation from relevant authorities', icon: 'school-outline', required: true },
    { id: 'logo', label: 'Institution Logo', description: 'Your institution logo or emblem', icon: 'image-outline', required: false },
  ],
};

// --- Document Upload Types ---
interface DocumentUpload {
  uri: string;
  name: string;
  type: string;
  size?: number;
  uploaded?: boolean;
  progress?: number;
  preview?: string;
  document_id?: string;
}

// --- Location Data ---
const DISTRICTS = [
  'Kampala', 'Jinja', 'Entebbe', 'Mukono', 'Gulu', 'Mbarara', 
  'Masaka', 'Mbale', 'Fort Portal', 'Arua', 'Lira', 'Soroti',
  'Busia', 'Tororo', 'Iganga', 'Kamuli', 'Kayunga', 'Luwero'
];

// ============================================================
// CUSTOMIZABLE UI COMPONENTS
// ============================================================

// --- Customizable Theme Colors ---
const THEME = {
  primary: '#4A7DFF',
  primaryLight: 'rgba(74, 125, 255, 0.1)',
  primaryDark: '#376fff',
  success: '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  background: '#FFFFFF',
  cardBackground: '#F8F9FC',
  textPrimary: '#1F2F5F',
  textSecondary: '#8A8AAE',
  border: '#E8ECF4',
  shadow: 'rgba(74, 125, 255, 0.15)',
};

// --- Custom Step Icon ---
const StepIcon = ({ icon, step, total, isDesktop }: any) => {
  const getColor = () => {
    if (step === total) return THEME.success;
    return THEME.primary;
  };

  return (
    <View style={[styles.customStepIcon, isDesktop && styles.customStepIconDesktop]}>
      <LinearGradient
        colors={[getColor(), getColor() + 'CC']}
        style={styles.customStepIconGradient}
      >
        <Text style={styles.customStepIconText}>{icon}</Text>
      </LinearGradient>
    </View>
  );
};

// --- Custom Card with Glass Effect ---
const GlassCard = ({ children, style, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.glassCard, style]} 
    onPress={onPress}
    activeOpacity={0.8}
    disabled={!onPress}
  >
    {children}
  </TouchableOpacity>
);

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
        <Text style={styles.customBusinessIcon}>{item.icon}</Text>
      </View>
      <Text style={[
        styles.customBusinessLabel,
        { color: selected ? '#FFFFFF' : THEME.textPrimary }
      ]}>{item.label}</Text>
      <Text style={[
        styles.customBusinessDescription,
        { color: selected ? 'rgba(255,255,255,0.8)' : THEME.textSecondary }
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
      <Text style={styles.customCategoryIcon}>{item.icon}</Text>
    </View>
    <Text style={[
      styles.customCategoryLabel,
      { color: selected ? item.color : THEME.textPrimary }
    ]}>{item.label}</Text>
    {selected && (
      <View style={styles.customCategoryCheck}>
        <Ionicons name="checkmark-circle" size={20} color={item.color} />
      </View>
    )}
  </TouchableOpacity>
);

// --- Custom Wizard Question with better UI ---
const CustomWizardQuestion = ({ question, value, onChange }: any) => {
  const [customText, setCustomText] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setCustomText(value);
    }
  }, [value]);

  if (question.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.customWizardQuestion}>
        <View style={styles.customWizardQuestionHeader}>
          <Text style={styles.customWizardQuestionIcon}>{question.icon || '❓'}</Text>
          <Text style={styles.customWizardQuestionLabel}>{question.label}</Text>
        </View>
        <MultiSelect
          options={question.options}
          selected={selected}
          onSelect={(newSelected: string[]) => onChange(newSelected)}
          placeholder={question.placeholder}
        />
      </View>
    );
  }

  if (question.type === 'select') {
    return (
      <View style={styles.customWizardQuestion}>
        <View style={styles.customWizardQuestionHeader}>
          <Text style={styles.customWizardQuestionIcon}>{question.icon || '❓'}</Text>
          <Text style={styles.customWizardQuestionLabel}>{question.label}</Text>
        </View>
        <Select
          options={question.options}
          selected={value || ''}
          onSelect={(option: string) => onChange(option)}
          placeholder="Select an option"
        />
      </View>
    );
  }

  return (
    <View style={styles.customWizardQuestion}>
      <View style={styles.customWizardQuestionHeader}>
        <Text style={styles.customWizardQuestionIcon}>{question.icon || '❓'}</Text>
        <Text style={styles.customWizardQuestionLabel}>{question.label}</Text>
      </View>
      <TextInput
        style={styles.customWizardInput}
        placeholder={question.placeholder || 'Enter details...'}
        placeholderTextColor="#8A8AAE"
        value={customText}
        onChangeText={(text) => {
          setCustomText(text);
          onChange(text);
        }}
      />
    </View>
  );
};

// --- Custom Document Upload Box ---
const CustomDocumentUploadBox = ({ 
  document, 
  docType, 
  onUpload, 
  onRemove,
  uploading,
  uploaded,
  fileName,
  fileSize,
  preview,
  required,
  docData,
}: any) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.customUploadBox, uploaded && styles.customUploadBoxUploaded]}>
      <View style={styles.customUploadBoxHeader}>
        <View style={[
          styles.customUploadBoxIconContainer,
          { backgroundColor: uploaded ? 'rgba(46, 204, 113, 0.1)' : 'rgba(74,125,255,0.1)' }
        ]}>
          <Ionicons 
            name={uploaded ? 'checkmark-circle' : document.icon} 
            size={20} 
            color={uploaded ? '#2ECC71' : '#4A7DFF'} 
          />
        </View>
        <View style={styles.customUploadBoxInfo}>
         <Text style={styles.customUploadBoxLabel}>
  {document.label} {required && <Text style={{ color: '#E74C3C' }}>*</Text>}
</Text>
          <Text style={styles.customUploadBoxDescription}>{document.description}</Text>
        </View>
        <View style={[
          styles.customUploadBoxStatus,
          { backgroundColor: uploaded ? 'rgba(46, 204, 113, 0.1)' : 'rgba(74,125,255,0.08)' }
        ]}>
          <Text style={[
            styles.customUploadBoxStatusText,
            { color: uploaded ? '#2ECC71' : '#4A7DFF' }
          ]}>
            {uploaded ? 'Uploaded' : 'Pending'}
          </Text>
        </View>
      </View>

      {uploaded && fileName ? (
        <View style={styles.customUploadBoxPreview}>
          {preview && !imageError ? (
            <Image 
              source={{ uri: preview }} 
              style={styles.customUploadBoxImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.customUploadBoxFileIcon}>
              <Ionicons name="document-text" size={32} color="#4A7DFF" />
            </View>
          )}
          <View style={styles.customUploadBoxFileInfo}>
            <Text style={styles.customUploadBoxFileName} numberOfLines={1}>{fileName}</Text>
            {fileSize && <Text style={styles.customUploadBoxFileSize}>{fileSize}</Text>}
          </View>
          <TouchableOpacity
            style={styles.customUploadBoxRemove}
            onPress={() => onRemove(docType)}
          >
            <View style={styles.customUploadBoxRemoveButton}>
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      ) : uploading ? (
        <View style={styles.customUploadBoxProgress}>
          <ActivityIndicator color="#4A7DFF" />
          <Text style={styles.customUploadBoxProgressText}>Uploading...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.customUploadBoxDropZone}
          onPress={() => onUpload(docType)}
          activeOpacity={0.7}
        >
          <View style={styles.customUploadBoxDropIcon}>
            <Ionicons name="cloud-upload-outline" size={32} color="#4A7DFF" />
          </View>
          <Text style={styles.customUploadBoxDropText}>Tap to upload your file</Text>
          <Text style={styles.customUploadBoxDropSubtext}>Supports PDF, JPG, PNG (Max 5MB)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// --- Multi-Select Component (Improved) ---
const MultiSelect = ({ options, selected, onSelect, placeholder }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onSelect(selected.filter((item: string) => item !== option));
    } else {
      onSelect([...selected, option]);
    }
  };

  return (
    <View style={styles.multiselectContainer}>
      <TouchableOpacity
        style={styles.multiselectTrigger}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selected.length > 0 ? styles.multiselectText : styles.multiselectPlaceholder}>
          {selected.length > 0 ? selected.join(', ') : placeholder || 'Select options'}
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
              <Text style={styles.modalTitle}>Select Options</Text>
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
                    selected.includes(item) && styles.modalOptionSelected,
                  ]}
                  onPress={() => toggleOption(item)}
                >
                  <View style={styles.modalOptionCheck}>
                    {selected.includes(item) && (
                      <Ionicons name="checkmark-circle" size={24} color="#4A7DFF" />
                    )}
                  </View>
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// --- Select Component (Improved) ---
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

// --- Step Indicator (Improved) ---
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

// --- Main BusinessRegistrationWizard Component ---
const BusinessRegistrationWizardContent = ({ navigation }: any) => {
  const { user } = useAuth();
  const { isDesktop } = useBreakpoint();
  
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [district, setDistrict] = useState<string | null>(null);
  const [businessDescription, setBusinessDescription] = useState('');
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [shopId, setShopId] = useState<string | null>(null);
  
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const BUCKET_NAME = 'business_documents';

  const getWizardType = () => {
    if (!businessType || !category) return null;
    const categoryData = CATEGORIES[businessType]?.find(c => c.id === category);
    return categoryData?.wizard || null;
  };

  const getQuestions = () => {
    const wizardType = getWizardType();
    return wizardType ? WIZARD_QUESTIONS[wizardType] || [] : [];
  };

  const getDocumentRequirements = () => {
    if (!businessType) return [];
    return DOCUMENT_REQUIREMENTS[businessType] || DOCUMENT_REQUIREMENTS.shop;
  };

  // ... (keep all existing upload functions - they remain the same)

  const uploadDocument = async (docType: string, file: any) => {
    try {
      console.log(`🚀 Starting upload for ${docType}`);
      
      if (!file || !file.uri) {
        throw new Error('No file data provided');
      }

      // File size validation
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file under 5MB');
        return;
      }

      setUploadingDoc(docType);
      
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please sign in first');
        setUploadingDoc(null);
        return;
      }

      console.log('📤 Processing file:', file.name);

      let base64Data = '';
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        const reader = new FileReader();
        base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      const mimeType = file.mimeType || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      console.log('✅ File converted to Base64, length:', base64Data.length);

      const { data: docRecord, error: dbError } = await supabase
        .from('business_documents')
        .insert({
          business_id: shopId || null,
          document_type: docType,
          file_name: file.name,
          file_url: dataUrl,
          file_data: base64Data,
          file_size: file.size || 0,
          mime_type: mimeType,
          uploaded_by: userId,
          status: 'pending',
          is_verified: false,
        } as any)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ Database record created:', docRecord.id);

      setDocuments(prev => ({
        ...prev,
        [docType]: { 
          ...prev[docType], 
          uri: dataUrl,
          uploaded: true,
          progress: 100,
          document_id: docRecord.id,
        }
      }));

      Alert.alert('Success', `${docType} document uploaded successfully!`);

    } catch (error: any) {
      console.error('❌ Upload error:', error);
      Alert.alert(
        'Upload Failed', 
        error.message || 'Failed to upload document. Please try again.',
        [{ text: 'OK' }]
      );
      
      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 0, uploaded: false }
      }));
    } finally {
      setUploadingDoc(null);
    }
  };

  const pickDocument = async (docType: string) => {
    console.log('📂 pickDocument called for:', docType, 'on platform:', Platform.OS);

    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Using web file picker for:', docType);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
        input.multiple = false;
        input.style.display = 'none';
        
        document.body.appendChild(input);
        
        const fileSelected = new Promise((resolve, reject) => {
          input.onchange = (e: any) => {
            console.log('📄 File input onchange triggered for:', docType);
            const file = e.target.files?.[0];
            if (file) {
              console.log('📄 Web file selected:', file.name, file.size, file.type);
              
              const objectUrl = URL.createObjectURL(file);
              
              const fileData = {
                uri: objectUrl,
                name: file.name,
                mimeType: file.type || 'application/pdf',
                size: file.size,
                blob: file,
              };
              
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
              resolve(fileData);
            } else {
              console.log('❌ No file selected');
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
              reject(new Error('No file selected'));
            }
          };
          
          input.oncancel = () => {
            console.log('❌ User cancelled file selection for:', docType);
            if (input.parentNode) {
              input.parentNode.removeChild(input);
            }
            reject(new Error('Cancelled'));
          };
        });
        
        console.log('🖱️ Clicking file input for:', docType);
        input.click();
        
        try {
          const fileData = await fileSelected as any;
          console.log('✅ Web file picked successfully:', fileData.name);
          
          setDocuments(prev => ({
            ...prev,
            [docType]: {
              uri: fileData.uri,
              name: fileData.name,
              type: fileData.mimeType,
              size: fileData.size,
              uploaded: false,
              progress: 0,
              preview: fileData.mimeType?.startsWith('image/') ? fileData.uri : undefined,
            }
          }));
          
          await uploadDocument(docType, fileData);
          
        } catch (error: any) {
          if (error.message !== 'Cancelled') {
            console.error('❌ File selection error:', error);
            Alert.alert('Error', 'Failed to select file. Please try again.');
          } else {
            console.log('ℹ️ User cancelled file selection');
          }
        }
        return;
      }

      console.log('📱 Using mobile document picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      console.log('📱 Document pick result:', JSON.stringify(result, null, 2));

      const resultAny = result as any;
      let file: any = null;

      if (resultAny.assets && resultAny.assets.length > 0) {
        const asset = resultAny.assets[0];
        file = {
          uri: asset.uri,
          name: asset.name || 'document',
          mimeType: asset.mimeType || 'application/pdf',
          size: asset.size || 0,
        };
      } else if (resultAny.type === 'success') {
        file = {
          uri: resultAny.uri,
          name: resultAny.name || 'document',
          mimeType: resultAny.mimeType || 'application/pdf',
          size: resultAny.size || 0,
        };
      } else if (resultAny.type === 'cancel') {
        console.log('User cancelled document pick');
        return;
      }

      if (file) {
        console.log('✅ File picked successfully:', file.name);
        
        setDocuments(prev => ({
          ...prev,
          [docType]: {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
            size: file.size,
            uploaded: false,
            progress: 0,
            preview: file.mimeType?.startsWith('image/') ? file.uri : undefined,
          }
        }));

        await uploadDocument(docType, file);
      } else {
        console.log('No file selected or unexpected result format');
      }
    } catch (error: any) {
      console.error('❌ Document pick error:', error);
      if (error.message !== 'Cancelled') {
        Alert.alert('Error', `Failed to select document: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const pickImage = async (docType: string) => {
    console.log('📸 pickImage called for:', docType, 'on platform:', Platform.OS);

    try {
      if (Platform.OS === 'web') {
        console.log('🌐 Using web camera picker for:', docType);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        const fileSelected = new Promise((resolve, reject) => {
          input.onchange = (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
              console.log('📸 Web photo captured:', file.name);
              const objectUrl = URL.createObjectURL(file);
              
              const fileData = {
                uri: objectUrl,
                name: file.name || 'photo.jpg',
                mimeType: file.type || 'image/jpeg',
                size: file.size || 0,
                blob: file,
              };
              
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
              resolve(fileData);
            } else {
              if (input.parentNode) {
                input.parentNode.removeChild(input);
              }
              reject(new Error('No photo captured'));
            }
          };
          
          input.oncancel = () => {
            console.log('User cancelled camera');
            if (input.parentNode) {
              input.parentNode.removeChild(input);
            }
            reject(new Error('Cancelled'));
          };
        });
        
        input.click();
        
        try {
          const fileData = await fileSelected as any;
          console.log('✅ Web photo captured successfully');
          
          setDocuments(prev => ({
            ...prev,
            [docType]: {
              uri: fileData.uri,
              name: fileData.name,
              type: fileData.mimeType,
              size: fileData.size,
              uploaded: false,
              progress: 0,
              preview: fileData.uri,
            }
          }));
          
          await uploadDocument(docType, fileData);
        } catch (error: any) {
          if (error.message !== 'Cancelled') {
            console.error('Camera error:', error);
            Alert.alert('Error', 'Failed to capture photo. Please try again.');
          }
        }
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: `${docType}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize || 0,
        };
        
        setDocuments(prev => ({
          ...prev,
          [docType]: {
            uri: asset.uri,
            name: file.name,
            type: 'image/jpeg',
            size: file.size,
            uploaded: false,
            progress: 0,
            preview: asset.uri,
          }
        }));

        await uploadDocument(docType, file);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.message !== 'Cancelled') {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const showDocumentOptions = (docType: string) => {
    console.log('🔍 showDocumentOptions called for:', docType);
    console.log('📱 Platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      console.log('🌐 Web platform - opening file picker directly for:', docType);
      pickDocument(docType);
      return;
    }
    
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        { 
          text: 'Choose from Files', 
          onPress: () => {
            console.log('📁 User selected "Choose from Files" for:', docType);
            pickDocument(docType);
          }
        },
        { 
          text: 'Take Photo', 
          onPress: () => {
            console.log('📸 User selected "Take Photo" for:', docType);
            pickImage(docType);
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const removeDocument = (docType: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const docData = documents[docType];
              if (docData?.document_id) {
                const { error } = await supabase
                  .from('business_documents')
                  .delete()
                  .eq('id', docData.document_id);

                if (error) {
                  console.error('Error deleting document:', error);
                  Alert.alert('Error', 'Failed to remove document from database');
                  return;
                }
              }

              setDocuments(prev => ({
                ...prev,
                [docType]: { uri: '', name: '', type: '', uploaded: false, progress: 0 }
              }));

              Alert.alert('Success', 'Document removed successfully');
            } catch (error) {
              console.error('Remove error:', error);
              Alert.alert('Error', 'Failed to remove document');
            }
          }
        }
      ]
    );
  };

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
    setStep(step + 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

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

    const docRequirements = getDocumentRequirements();
    const requiredDocs = docRequirements.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.id]?.uploaded);

    console.log('📄 Required docs:', requiredDocs.map(d => d.id));
    console.log('📄 Uploaded docs:', Object.keys(documents).filter(key => documents[key]?.uploaded));
    console.log('📄 Missing docs:', missingDocs.map(d => d.id));

    if (missingDocs.length > 0) {
      Alert.alert(
        'Documents Required',
        `Please upload: ${missingDocs.map(d => d.label).join(', ')}`,
        [{ text: 'OK' }]
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

      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!userById) {
        console.log('📝 Creating user in users table...');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: userId,
            phone_number: userPhone || '',
            full_name: user?.name || 'Munolink Member',
            role: 'user',
            wallet_balance: 0,
            lifetime_savings: 0,
            kyc_verified: false,
          });

        if (createUserError) {
          console.error('❌ Error creating user:', createUserError);
          throw createUserError;
        }
        console.log('✅ User created in users table');
      }

      console.log('📝 Creating shop...');
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id: userId,
          name: businessName.trim(),
          area: district || null,
          description: businessDescription.trim() || null,
          category: category,
          business_type: businessType,
          business_settings: wizardAnswers as any,
          is_active: false,
          is_verified: false,
          rating: 0,
          review_count: 0,
        })
        .select('id')
        .single();

      if (shopError) {
        console.error('❌ SHOP INSERT ERROR:', shopError);
        throw shopError;
      }

      const businessId = shopData.id;
      setShopId(businessId);
      console.log('✅ Shop created with ID:', businessId);

      console.log('📝 Updating documents with business ID...');
      const documentEntries = Object.entries(documents);
      for (const [docType, docData] of documentEntries) {
        if (docData.uploaded && docData.uri && docData.document_id) {
          const { error: updateDocError } = await supabase
            .from('business_documents')
            .update({ business_id: businessId })
            .eq('id', docData.document_id)
            .eq('uploaded_by', userId);

          if (updateDocError) {
            console.error('Error updating document:', updateDocError);
          } else {
            console.log(`✅ Updated document ${docType} with business ID`);
          }
        }
      }

      console.log('📝 Creating verification request...');
      const { error: verificationError } = await supabase
        .from('verification_requests')
        .insert({
          business_id: businessId,
          requested_by: userId,
          status: 'pending',
          verification_type: 'business_verification',
        });

      if (verificationError) {
        console.error('❌ VERIFICATION INSERT ERROR:', verificationError);
        throw verificationError;
      }

      console.log('✅ Verification request created');

      const docCache: Record<string, any> = {};
      for (const [docType, docData] of documentEntries) {
        if (docData.uploaded && docData.document_id) {
          docCache[docType] = {
            document_id: docData.document_id,
            uploaded_at: new Date().toISOString()
          };
        }
      }

      await AsyncStorage.setItem(`documents_${businessId}`, JSON.stringify(docCache));

      console.log('✅ Document cache saved to AsyncStorage');

      const userRole = businessType === 'shop' ? 'shop_owner' : 
                       businessType === 'service' ? 'service_provider' : 
                       'institution_representative';
      
      console.log('📝 Updating user role to:', userRole);
      const { error: updateRoleError } = await supabase
        .from('users')
        .update({ role: userRole })
        .eq('id', userId);

      if (updateRoleError) {
        console.error('❌ Error updating user role:', updateRoleError);
        throw updateRoleError;
      }

      console.log('✅ User role updated successfully!');
      console.log('🎉 Registration complete!');

      setStep(6);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }).start();

    } catch (error: any) {
      console.error('❌ REGISTRATION ERROR:', error);
      
      let errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      
      if (error?.code === '23505') {
        errorMessage = 'A user with this phone number already exists. Please sign in instead.';
      }
      
      Alert.alert('Registration Failed', errorMessage, [{ text: 'OK' }]);
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
      <StepIcon icon="🚀" step={1} total={5} isDesktop={isDesktop} />
      
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
        <StepIcon icon="📂" step={2} total={5} isDesktop={isDesktop} />
        
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
  const renderStep3 = () => (
    <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
      <StepIcon icon="📝" step={3} total={5} isDesktop={isDesktop} />
      
      <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
        Tell us about your business
      </Text>
      <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
        Just a few details about your business
      </Text>

      <View style={[styles.customFormContainer, isDesktop && styles.customFormContainerDesktop]}>
        <View style={styles.customFormGroup}>
          <Text style={styles.customFormLabel}>Business Name *</Text>
          <TextInput
            style={styles.customFormInput}
            placeholder="e.g. TechWorld Kampala"
            placeholderTextColor="#8A8AAE"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.customFormGroup}>
          <Text style={styles.customFormLabel}>District *</Text>
          <Select
            options={DISTRICTS}
            selected={district || ''}
            onSelect={(value: string) => setDistrict(value)}
            placeholder="Select your district"
          />
        </View>

        <View style={styles.customFormGroup}>
          <Text style={styles.customFormLabel}>Description</Text>
          <TextInput
            style={[styles.customFormInput, styles.customFormTextArea]}
            placeholder="Tell customers about your business..."
            placeholderTextColor="#8A8AAE"
            multiline
            numberOfLines={3}
            value={businessDescription}
            onChangeText={setBusinessDescription}
          />
        </View>
      </View>
    </View>
  );

  // --- Render Step 4: Category-Specific Questions ---
  const renderStep4 = () => {
    const questions = getQuestions();

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <StepIcon icon="⚙️" step={4} total={5} isDesktop={isDesktop} />
        
        <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
          Let's customize your business
        </Text>
        <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
          Help us create a better experience for your customers
        </Text>

        <View style={[styles.customWizardContainer, isDesktop && styles.customWizardContainerDesktop]}>
          {questions.length === 0 ? (
            <View style={styles.customEmptyState}>
              <Text style={styles.customEmptyStateIcon}>✨</Text>
              <Text style={styles.customEmptyStateText}>No customization needed</Text>
              <Text style={styles.customEmptyStateSubtext}>Your business is ready to go!</Text>
            </View>
          ) : (
            questions.map((q) => (
              <CustomWizardQuestion
                key={q.key}
                question={q}
                value={wizardAnswers[q.key] || (q.type === 'multiselect' ? [] : '')}
                onChange={(value: any) =>
                  setWizardAnswers((prev) => ({ ...prev, [q.key]: value }))
                }
              />
            ))
          )}
        </View>
      </View>
    );
  };

  // --- Render Step 5: Document Upload ---
  const renderStep5 = () => {
    const docRequirements = getDocumentRequirements();

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <StepIcon icon="📄" step={5} total={5} isDesktop={isDesktop} />
        
        <Text style={[styles.customStepTitle, isDesktop && styles.customStepTitleDesktop]}>
          Upload Your Documents
        </Text>
        <Text style={[styles.customStepSubtitle, isDesktop && styles.customStepSubtitleDesktop]}>
          Upload the required documents to verify your business
        </Text>

        <View style={[styles.customVerificationContainer, isDesktop && styles.customVerificationContainerDesktop]}>
          <View style={styles.customVerificationItem}>
            <View style={[styles.customVerificationIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
            </View>
            <View style={styles.customVerificationContent}>
              <Text style={styles.customVerificationTitle}>Phone Verified</Text>
              <Text style={styles.customVerificationDesc}>Your phone number has been verified</Text>
            </View>
          </View>
        </View>

        <Text style={styles.customDocumentsTitle}>Required Documents</Text>
        <Text style={styles.customDocumentsSubtitle}>
          {businessType === 'shop' ? 'Upload your business registration and tax documents' :
           businessType === 'service' ? 'Upload your professional certifications and registration' :
           'Upload your institution registration and accreditation documents'}
        </Text>

        <View style={[styles.customUploadContainer, isDesktop && styles.customUploadContainerDesktop]}>
          {docRequirements.map((doc) => (
            <CustomDocumentUploadBox
              key={doc.id}
              document={doc}
              docType={doc.id}
              onUpload={showDocumentOptions}
              onRemove={removeDocument}
              uploading={uploadingDoc === doc.id}
              uploaded={!!documents[doc.id]?.uploaded}
              fileName={documents[doc.id]?.name}
              fileSize={documents[doc.id]?.size ? `${(documents[doc.id]?.size || 0 / 1024).toFixed(0)} KB` : undefined}
              preview={documents[doc.id]?.preview}
              required={doc.required}
              docData={documents[doc.id]}
            />
          ))}
        </View>

        <View style={styles.customVerificationNote}>
          <Ionicons name="information-circle-outline" size={16} color="#8A8AAE" />
          <Text style={styles.customVerificationNoteText}>
            Your business will be visible to customers after verification is complete (1-2 business days)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.customSubmitButton, isLoading && styles.customSubmitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.customSubmitGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.customSubmitButtonText}>Submit for Verification</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Render Step 6: Success ---
  const renderSuccess = () => (
    <Animated.View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop, { opacity: fadeAnim }]}>
      <View style={styles.customSuccessContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.customSuccessGradient}
        >
          <Text style={styles.customSuccessEmoji}>🎉</Text>
        </LinearGradient>
      </View>

      <Text style={styles.customSuccessTitle}>Your business is created!</Text>
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
            <Text style={styles.customSuccessFeatureTitle}>Verification Pending</Text>
            <Text style={styles.customSuccessFeatureDesc}>
              We're reviewing your documents (1-2 business days)
            </Text>
          </View>
        </View>

        <View style={styles.customSuccessFeature}>
          <View style={styles.customSuccessFeatureIcon}>
            <Ionicons name="rocket-outline" size={24} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.customSuccessFeatureTitle}>Ready for Setup</Text>
            <Text style={styles.customSuccessFeatureDesc}>
              Complete your profile and add your first product
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
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderSuccess();
      default:
        return null;
    }
  };

  const totalSteps = 6;

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
            {step <= 5 ? `Step ${step} of ${totalSteps - 1}` : 'Complete!'}
          </Text>
          {step < 6 && (
            <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {step < 6 && (
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

        {step < 6 && (
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
              onPress={step === 5 ? handleSubmit : nextStep}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {step === 5 ? 'Submit for Verification' : 'Continue'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Main Component (Wrapped with ResponsiveLayout) ---
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
  // ... (keep existing styles, I'll add the new custom styles)
  
  // ============================================================
  // CUSTOM STEP INDICATOR
  // ============================================================
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

  // ============================================================
  // CUSTOM STEP ICON
  // ============================================================
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

  // ============================================================
  // CUSTOM STEP TITLES
  // ============================================================
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

  // ============================================================
  // CUSTOM BUSINESS TYPE CARDS
  // ============================================================
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

  // ============================================================
  // CUSTOM CATEGORY CARDS
  // ============================================================
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

  // ============================================================
  // CUSTOM FORM
  // ============================================================
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

  // ============================================================
  // CUSTOM WIZARD QUESTIONS
  // ============================================================
  customWizardContainer: {
    gap: 18,
  },
  customWizardContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  customWizardQuestion: {
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  customWizardQuestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customWizardQuestionIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  customWizardQuestionLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  customWizardInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1F2F5F',
    fontSize: 15,
  },

  // ============================================================
  // CUSTOM VERIFICATION
  // ============================================================
  customVerificationContainer: {
    gap: 12,
    marginVertical: 16,
  },
  customVerificationContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  customVerificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  customVerificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customVerificationContent: {
    flex: 1,
  },
  customVerificationTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  customVerificationDesc: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  customVerificationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE5FF',
    marginTop: 8,
  },
  customVerificationNoteText: {
    flex: 1,
    color: '#8A8AAE',
    fontSize: 12,
    lineHeight: 18,
  },

  // ============================================================
  // CUSTOM DOCUMENT UPLOAD
  // ============================================================
  customDocumentsTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  customDocumentsSubtitle: {
    color: '#8A8AAE',
    fontSize: 13,
    marginBottom: 16,
  },
  customUploadContainer: {
    gap: 12,
    marginBottom: 16,
  },
  customUploadContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  customUploadBox: {
    backgroundColor: '#F8F9FC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  customUploadBoxUploaded: {
    borderColor: '#2ECC71',
    backgroundColor: 'rgba(46, 204, 113, 0.03)',
  },
  customUploadBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customUploadBoxIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customUploadBoxInfo: {
    flex: 1,
  },
  customUploadBoxLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  customUploadBoxDescription: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  customUploadBoxStatus: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  customUploadBoxStatusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  customUploadBoxDropZone: {
    borderWidth: 2,
    borderColor: '#DCE5FF',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFF',
    minHeight: 100,
  },
  customUploadBoxDropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  customUploadBoxDropText: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  customUploadBoxDropSubtext: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 4,
  },
  customUploadBoxPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  customUploadBoxImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  customUploadBoxFileIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customUploadBoxFileInfo: {
    flex: 1,
  },
  customUploadBoxFileName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  customUploadBoxFileSize: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  customUploadBoxRemove: {
    padding: 4,
  },
  customUploadBoxRemoveButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUploadBoxProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  customUploadBoxProgressText: {
    color: '#4A7DFF',
    fontSize: 14,
  },

  // ============================================================
  // CUSTOM SUBMIT BUTTON
  // ============================================================
  customSubmitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
    elevation: 3,
    shadowColor: '#4A7DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  customSubmitButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
  },
  customSubmitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  customSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // ============================================================
  // CUSTOM SUCCESS
  // ============================================================
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
  customEmptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  customEmptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  customEmptyStateText: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '500',
  },
  customEmptyStateSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },

  // ============================================================
  // GLASS CARD
  // ============================================================
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // ============================================================
  // EXISTING STYLES (keep all from original)
  // ============================================================
  // ... (keep all existing styles from the original file)
  
  // I'll keep the rest of the styles from the original file since they're already defined
  // but the custom styles above will override/enhance them
  
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
  // Multi-select and Select styles
  multiselectContainer: {
    marginBottom: 4,
  },
  multiselectTrigger: {
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
  multiselectText: {
    color: '#1F2F5F',
    fontSize: 15,
    flex: 1,
  },
  multiselectPlaceholder: {
    color: '#8A8AAE',
    fontSize: 15,
    flex: 1,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  modalOptionCheck: {
    width: 30,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1F2F5F',
    flex: 1,
  },
  modalDoneButton: {
    backgroundColor: '#4A7DFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});