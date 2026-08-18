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
  { id: 'shop', icon: '🏪', label: 'Shop', description: 'Sell products to customers' },
  { id: 'service', icon: '🔧', label: 'Service Provider', description: 'Offer services and appointments' },
  { id: 'institution', icon: '🏨', label: 'Institution', description: 'Hotel, School, Hospital, etc.' },
];

// --- Category Mappings ---
const CATEGORIES: Record<string, any[]> = {
  shop: [
    { id: 'electronics', icon: '📱', label: 'Electronics', wizard: 'products' },
    { id: 'fashion', icon: '👕', label: 'Fashion', wizard: 'products' },
    { id: 'restaurant', icon: '🍕', label: 'Restaurant', wizard: 'menu' },
    { id: 'furniture', icon: '🛋️', label: 'Furniture', wizard: 'products' },
    { id: 'hardware', icon: '🔨', label: 'Hardware', wizard: 'products' },
    { id: 'pharmacy', icon: '💊', label: 'Pharmacy', wizard: 'products' },
    { id: 'grocery', icon: '🛒', label: 'Grocery', wizard: 'products' },
    { id: 'supermarket', icon: '🏪', label: 'Supermarket', wizard: 'products' },
    { id: 'books', icon: '📚', label: 'Books', wizard: 'products' },
    { id: 'jewelry', icon: '💎', label: 'Jewelry', wizard: 'products' },
    { id: 'art', icon: '🎨', label: 'Art & Crafts', wizard: 'products' },
  ],
  service: [
    { id: 'mechanic', icon: '🔧', label: 'Mechanic', wizard: 'services' },
    { id: 'electrician', icon: '⚡', label: 'Electrician', wizard: 'services' },
    { id: 'doctor', icon: '🏥', label: 'Doctor', wizard: 'services' },
    { id: 'lawyer', icon: '⚖️', label: 'Lawyer', wizard: 'services' },
    { id: 'photographer', icon: '📸', label: 'Photographer', wizard: 'services' },
    { id: 'interior_designer', icon: '🪑', label: 'Interior Designer', wizard: 'services' },
    { id: 'cleaner', icon: '🧹', label: 'Cleaner', wizard: 'services' },
    { id: 'tutor', icon: '📖', label: 'Tutor', wizard: 'services' },
    { id: 'plumber', icon: '🔧', label: 'Plumber', wizard: 'services' },
    { id: 'painter', icon: '🎨', label: 'Painter', wizard: 'services' },
    { id: 'consultant', icon: '💼', label: 'Consultant', wizard: 'services' },
    { id: 'designer', icon: '🎨', label: 'Designer', wizard: 'services' },
    { id: 'developer', icon: '💻', label: 'Developer', wizard: 'services' },
    { id: 'writer', icon: '✍️', label: 'Writer', wizard: 'services' },
    { id: 'marketer', icon: '📈', label: 'Marketer', wizard: 'services' },
    { id: 'accountant', icon: '📊', label: 'Accountant', wizard: 'services' },
  ],
  institution: [
    { id: 'hospital', icon: '🏥', label: 'Hospital', wizard: 'institution' },
    { id: 'school', icon: '🏫', label: 'School', wizard: 'institution' },
    { id: 'hotel', icon: '🏨', label: 'Hotel', wizard: 'hotel' },
    { id: 'restaurant', icon: '🍕', label: 'Restaurant', wizard: 'menu' },
    { id: 'bank', icon: '🏦', label: 'Bank', wizard: 'institution' },
    { id: 'ngo', icon: '🤝', label: 'NGO', wizard: 'institution' },
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
      placeholder: 'Select brands you sell'
    },
    { 
      key: 'warranty', 
      label: 'Do you offer warranty?', 
      type: 'select', 
      options: ['Yes - 12 months', 'Yes - 24 months', 'No'] 
    },
    { 
      key: 'delivery', 
      label: 'Do you offer delivery?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'] 
    },
    { 
      key: 'pickup', 
      label: 'Is in-store pickup available?', 
      type: 'select', 
      options: ['Yes', 'No'] 
    },
    { 
      key: 'payment_methods', 
      label: 'Payment methods accepted?', 
      type: 'multiselect',
      options: ['Cash', 'Mobile Money', 'Bank Transfer', 'Card', 'Credit'],
      placeholder: 'Select payment methods'
    },
  ],
  services: [
    { 
      key: 'service_type', 
      label: 'What type of services do you offer?', 
      type: 'multiselect',
      options: ['Repairs', 'Consultations', 'Installation', 'Maintenance', 'Training', 'Other'],
      placeholder: 'Select service types'
    },
    { 
      key: 'experience', 
      label: 'Years of experience?', 
      type: 'select',
      options: ['Less than 1 year', '1-3 years', '3-5 years', '5-10 years', '10+ years'] 
    },
    { 
      key: 'certification', 
      label: 'Do you have certifications?', 
      type: 'select', 
      options: ['Yes - Licensed', 'Yes - Certified', 'No'] 
    },
    { 
      key: 'availability', 
      label: 'When are you available?', 
      type: 'multiselect',
      options: ['Weekdays', 'Weekends', 'Mornings', 'Afternoons', 'Evenings', '24/7'],
      placeholder: 'Select availability'
    },
    { 
      key: 'service_area', 
      label: 'What areas do you cover?', 
      type: 'multiselect',
      options: ['Kampala', 'Jinja', 'Entebbe', 'Mukono', 'Gulu', 'Other'],
      placeholder: 'Select service areas'
    },
  ],
  menu: [
    { 
      key: 'cuisine', 
      label: 'What type of cuisine?', 
      type: 'multiselect',
      options: ['Italian', 'Local', 'Chinese', 'Indian', 'Mexican', 'Fast Food', 'Other'],
      placeholder: 'Select cuisine types'
    },
    { 
      key: 'delivery', 
      label: 'Do you offer delivery?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'] 
    },
    { 
      key: 'reservations', 
      label: 'Do you accept reservations?', 
      type: 'select', 
      options: ['Yes', 'No'] 
    },
    { 
      key: 'dietary_options', 
      label: 'Dietary options available?', 
      type: 'multiselect',
      options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'None'],
      placeholder: 'Select dietary options'
    },
  ],
  hotel: [
    { 
      key: 'room_types', 
      label: 'What room types do you have?', 
      type: 'multiselect',
      options: ['Standard', 'Deluxe', 'Suite', 'Executive', 'Family', 'Dormitory'],
      placeholder: 'Select room types'
    },
    { 
      key: 'amenities', 
      label: 'What amenities do you offer?', 
      type: 'multiselect',
      options: ['Pool', 'Gym', 'Restaurant', 'Spa', 'WiFi', 'Parking', 'Conference Room'],
      placeholder: 'Select amenities'
    },
    { 
      key: 'parking', 
      label: 'Do you offer parking?', 
      type: 'select', 
      options: ['Yes - Free', 'Yes - Paid', 'No'] 
    },
    { 
      key: 'check_in', 
      label: 'Check-in time?', 
      type: 'select',
      options: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', 'Flexible'] 
    },
    { 
      key: 'check_out', 
      label: 'Check-out time?', 
      type: 'select',
      options: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', 'Flexible'] 
    },
  ],
  institution: [
    { 
      key: 'service_type', 
      label: 'What services do you offer?', 
      type: 'multiselect',
      options: ['Education', 'Healthcare', 'Banking', 'Religious', 'Community', 'Other'],
      placeholder: 'Select service types'
    },
    { 
      key: 'capacity', 
      label: 'What is your capacity?', 
      type: 'select',
      options: ['Small (1-50)', 'Medium (51-200)', 'Large (201-500)', 'Very Large (500+)'] 
    },
    { 
      key: 'certification', 
      label: 'Do you have certifications?', 
      type: 'select', 
      options: ['Yes - Licensed', 'Yes - Accredited', 'No'] 
    },
    { 
      key: 'operating_hours', 
      label: 'Operating hours?', 
      type: 'select',
      options: ['24/7', 'Weekdays only', 'Weekends only', 'Custom hours'] 
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

// --- Sub-components ---
const StepIndicator = ({ currentStep, totalSteps }: any) => (
  <View style={styles.stepIndicatorContainer}>
    {Array.from({ length: totalSteps }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i === currentStep && styles.stepDotActive,
          i < currentStep && styles.stepDotCompleted,
        ]}
      />
    ))}
  </View>
);

const BusinessTypeCard = ({ item, selected, onPress }: any) => (
  <TouchableOpacity
    style={[styles.businessTypeCard, selected && styles.businessTypeCardSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.businessTypeIconContainer}>
      <Text style={styles.businessTypeIcon}>{item.icon}</Text>
    </View>
    <Text style={styles.businessTypeLabel}>{item.label}</Text>
    <Text style={styles.businessTypeDescription}>{item.description}</Text>
  </TouchableOpacity>
);

const CategoryCard = ({ item, selected, onPress }: any) => (
  <TouchableOpacity
    style={[styles.categoryCard, selected && styles.categoryCardSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.categoryIcon}>{item.icon}</Text>
    <Text style={styles.categoryLabel}>{item.label}</Text>
  </TouchableOpacity>
);

// --- Multi-Select Component ---
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

const WizardQuestion = ({ question, value, onChange }: any) => {
  const [customText, setCustomText] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setCustomText(value);
    }
  }, [value]);

  if (question.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <View style={styles.wizardQuestion}>
        <Text style={styles.wizardQuestionLabel}>{question.label}</Text>
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
      <View style={styles.wizardQuestion}>
        <Text style={styles.wizardQuestionLabel}>{question.label}</Text>
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
    <View style={styles.wizardQuestion}>
      <Text style={styles.wizardQuestionLabel}>{question.label}</Text>
      <TextInput
        style={styles.wizardInput}
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

// --- Document Upload Box Component ---
const DocumentUploadBox = ({ 
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
  return (
    <View style={styles.uploadBox}>
      <View style={styles.uploadBoxHeader}>
        <View style={styles.uploadBoxIconContainer}>
          <Ionicons name={document.icon} size={20} color="#4A7DFF" />
        </View>
        <View style={styles.uploadBoxInfo}>
          <Text style={styles.uploadBoxLabel}>
            {document.label} {required && <Text style={styles.requiredStar}>*</Text>}
          </Text>
          <Text style={styles.uploadBoxDescription}>{document.description}</Text>
        </View>
      </View>

      {uploaded && fileName ? (
        <View style={styles.uploadBoxPreview}>
          {preview || (docData?.uri && docData.uri.startsWith('data:')) ? (
            <Image source={{ uri: docData?.uri || preview }} style={styles.uploadBoxImage} />
          ) : (
            <View style={styles.uploadBoxFileInfo}>
              <Ionicons name="document" size={32} color="#4A7DFF" />
              <View style={styles.uploadBoxFileDetails}>
                <Text style={styles.uploadBoxFileName} numberOfLines={1}>{fileName}</Text>
                {fileSize && <Text style={styles.uploadBoxFileSize}>{fileSize}</Text>}
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.uploadBoxRemove}
            onPress={() => onRemove(docType)}
          >
            <Ionicons name="close-circle" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      ) : uploading ? (
        <View style={styles.uploadBoxProgress}>
          <ActivityIndicator color="#4A7DFF" />
          <Text style={styles.uploadBoxProgressText}>Uploading...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadBoxDropZone}
          onPress={() => {
            console.log('📂 Upload box tapped for:', docType);
            onUpload(docType);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={40} color="#8A8AAE" />
          <Text style={styles.uploadBoxDropText}>Tap to upload your file</Text>
          <Text style={styles.uploadBoxDropSubtext}>Supports PDF, JPG, PNG (Max 5MB)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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

  // --- Test Bucket Connection ---
  const testBucketConnection = async () => {
    console.log('🧪 Testing bucket connection...');
    
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      console.log('📦 All buckets:', buckets);
      
      if (listError) {
        console.error('❌ List error:', listError);
        Alert.alert('Error', 'Failed to list buckets: ' + listError.message);
        return;
      }
      
      const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
      console.log(`🔍 ${BUCKET_NAME} exists?`, bucketExists);
      
      if (!bucketExists) {
        console.log('📦 Creating bucket...');
        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 5242880,
        });
        
        if (error) {
          console.error('❌ Create error:', error);
          Alert.alert('Error', 'Failed to create bucket: ' + error.message);
          return;
        }
        console.log('✅ Bucket created:', data);
      }
      
      const { data: files, error: filesError } = await supabase.storage
        .from(BUCKET_NAME)
        .list();
      
      console.log('📄 Files in bucket:', files);
      if (filesError) console.error('❌ Files error:', filesError);
      
      const testBlob = new Blob(['test'], { type: 'text/plain' });
      const testPath = `test_${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(testPath, testBlob, {
          contentType: 'text/plain',
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('❌ Upload test error:', uploadError);
        Alert.alert('Upload Test Failed', uploadError.message);
      } else {
        console.log('✅ Test upload successful:', uploadData);
        
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(testPath);
        console.log('🔗 Public URL:', publicUrl);
        
        await supabase.storage.from(BUCKET_NAME).remove([testPath]);
        
        Alert.alert('Success', 'Bucket is working! Test file uploaded and deleted.');
      }
      
    } catch (error: any) {
      console.error('❌ Test error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // --- Test File Picker for Web ---
  const testFilePicker = () => {
    console.log('🧪 Testing file picker directly...');
    
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png';
      input.style.display = 'none';
      document.body.appendChild(input);
      
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          console.log('✅ Test file selected:', file.name);
          Alert.alert('Success', `File selected: ${file.name}`);
        } else {
          console.log('❌ Test failed - no file');
          Alert.alert('Error', 'No file selected');
        }
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };
      
      input.oncancel = () => {
        console.log('❌ Test cancelled');
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };
      
      input.click();
    } else {
      Alert.alert('Not Web', 'This test is for web platform only');
    }
  };

  const uploadDocument = async (docType: string, file: any) => {
    try {
      console.log(`🚀 Starting upload for ${docType}`);
      
      if (!file || !file.uri) {
        throw new Error('No file data provided');
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
      <View style={styles.stepIconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.stepIconGradient}
        >
          <Text style={styles.stepIcon}>🚀</Text>
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>What kind of business are you starting?</Text>
      <Text style={styles.stepSubtitle}>
        Choose the type that best describes your business
      </Text>

      <View style={[styles.businessTypesGrid, isDesktop && styles.businessTypesGridDesktop]}>
        {BUSINESS_TYPES.map((type) => (
          <BusinessTypeCard
            key={type.id}
            item={type}
            selected={businessType === type.id}
            onPress={() => setBusinessType(type.id)}
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
        <View style={styles.stepIconContainer}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            style={styles.stepIconGradient}
          >
            <Text style={styles.stepIcon}>📂</Text>
          </LinearGradient>
        </View>

        <Text style={styles.stepTitle}>Great! What do you specialize in?</Text>
        <Text style={styles.stepSubtitle}>
          Choose the category that best fits your business
        </Text>

        <View style={[styles.categoriesGrid, isDesktop && styles.categoriesGridDesktop]}>
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              item={cat}
              selected={category === cat.id}
              onPress={() => setCategory(cat.id)}
            />
          ))}
        </View>
      </View>
    );
  };

  // --- Render Step 3: Business Identity ---
  const renderStep3 = () => (
    <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
      <View style={styles.stepIconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.stepIconGradient}
        >
          <Text style={styles.stepIcon}>📝</Text>
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>Tell us about your business</Text>
      <Text style={styles.stepSubtitle}>
        Just a few details about your business
      </Text>

      <View style={[styles.formContainer, isDesktop && styles.formContainerDesktop]}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Business Name *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="e.g. TechWorld Kampala"
            placeholderTextColor="#8A8AAE"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>District *</Text>
          <Select
            options={DISTRICTS}
            selected={district || ''}
            onSelect={(value: string) => setDistrict(value)}
            placeholder="Select your district"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
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

    if (questions.length === 0) {
      return (
        <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
          <View style={styles.stepIconContainer}>
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              style={styles.stepIconGradient}
            >
              <Text style={styles.stepIcon}>✨</Text>
            </LinearGradient>
          </View>

          <Text style={styles.stepTitle}>Let's customize your business</Text>
          <Text style={styles.stepSubtitle}>
            Your business is almost ready to launch
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <View style={styles.stepIconContainer}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            style={styles.stepIconGradient}
          >
            <Text style={styles.stepIcon}>⚙️</Text>
          </LinearGradient>
        </View>

        <Text style={styles.stepTitle}>Let's customize your business</Text>
        <Text style={styles.stepSubtitle}>
          Select options to help us create a better experience for your customers
        </Text>

        <View style={[styles.wizardContainer, isDesktop && styles.wizardContainerDesktop]}>
          {questions.map((q) => (
            <WizardQuestion
              key={q.key}
              question={q}
              value={wizardAnswers[q.key] || (q.type === 'multiselect' ? [] : '')}
              onChange={(value: any) =>
                setWizardAnswers((prev) => ({ ...prev, [q.key]: value }))
              }
            />
          ))}
        </View>
      </View>
    );
  };

  // --- Render Step 5: Document Upload ---
  const renderStep5 = () => {
    const docRequirements = getDocumentRequirements();

    return (
      <View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop]}>
        <View style={styles.stepIconContainer}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            style={styles.stepIconGradient}
          >
            <Text style={styles.stepIcon}>📄</Text>
          </LinearGradient>
        </View>

        <Text style={styles.stepTitle}>Upload Your Documents</Text>
        <Text style={styles.stepSubtitle}>
          Upload the required documents to verify your business
        </Text>

        <View style={[styles.verificationContainer, isDesktop && styles.verificationContainerDesktop]}>
          <View style={styles.verificationItem}>
            <View style={[styles.verificationIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
            </View>
            <View style={styles.verificationContent}>
              <Text style={styles.verificationTitle}>Phone Verified</Text>
              <Text style={styles.verificationDesc}>Your phone number has been verified</Text>
            </View>
          </View>
        </View>

        <Text style={styles.documentsSectionTitle}>Required Documents</Text>
        <Text style={styles.documentsSectionSubtitle}>
          {businessType === 'shop' ? 'Upload your business registration and tax documents' :
           businessType === 'service' ? 'Upload your professional certifications and registration' :
           'Upload your institution registration and accreditation documents'}
        </Text>

        <View style={[styles.uploadBoxContainer, isDesktop && styles.uploadBoxContainerDesktop]}>
          {docRequirements.map((doc) => (
            <DocumentUploadBox
              key={doc.id}
              document={doc}
              docType={doc.id}
              onUpload={showDocumentOptions}
              onRemove={removeDocument}
              uploading={uploadingDoc === doc.id}
              uploaded={!!documents[doc.id]?.uploaded}
              fileName={documents[doc.id]?.name}
              fileSize={documents[doc.id]?.size ? `${(documents[doc.id].size || 0 / 1024).toFixed(0)} KB` : undefined}
              preview={documents[doc.id]?.preview}
              required={doc.required}
              docData={documents[doc.id]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { marginTop: 10, backgroundColor: '#9B59B6' }]}
          onPress={testBucketConnection}
        >
          <View style={[styles.continueGradient, { backgroundColor: '#9B59B6' }]}>
            <Text style={styles.continueButtonText}>🧪 Test Bucket Connection</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, { marginTop: 10, backgroundColor: '#FF6B6B' }]}
          onPress={testFilePicker}
        >
          <View style={[styles.continueGradient, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.continueButtonText}>🧪 Test File Picker</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.verificationNote}>
          <Ionicons name="information-circle-outline" size={16} color="#8A8AAE" />
          <Text style={styles.verificationNoteText}>
            Your business will be visible to customers after verification is complete (1-2 business days)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Submit for Verification</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Render Step 6: Success ---
  const renderSuccess = () => (
    <Animated.View style={[styles.stepContainer, isDesktop && styles.stepContainerDesktop, { opacity: fadeAnim }]}>
      <View style={styles.successContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.successGradient}
        >
          <Text style={styles.successEmoji}>🎉</Text>
        </LinearGradient>
      </View>

      <Text style={styles.successTitle}>Your business is created!</Text>
      <Text style={styles.successSubtitle}>
        {businessName} is now registered on Munolink.
      </Text>

      <View style={[styles.successFeatures, isDesktop && styles.successFeaturesDesktop]}>
        <View style={styles.successFeature}>
          <View style={styles.successFeatureIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
          </View>
          <View>
            <Text style={styles.successFeatureTitle}>Profile Created</Text>
            <Text style={styles.successFeatureDesc}>
              Your business profile is ready to be customized
            </Text>
          </View>
        </View>

        <View style={styles.successFeature}>
          <View style={styles.successFeatureIcon}>
            <Ionicons name="time-outline" size={24} color="#F1C40F" />
          </View>
          <View>
            <Text style={styles.successFeatureTitle}>Verification Pending</Text>
            <Text style={styles.successFeatureDesc}>
              We're reviewing your documents (1-2 business days)
            </Text>
          </View>
        </View>

        <View style={styles.successFeature}>
          <View style={styles.successFeatureIcon}>
            <Ionicons name="rocket-outline" size={24} color="#4A7DFF" />
          </View>
          <View>
            <Text style={styles.successFeatureTitle}>Ready for Setup</Text>
            <Text style={styles.successFeatureDesc}>
              Complete your profile and add your first product
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.continueButton, isDesktop && styles.continueButtonDesktop]} onPress={handleFinish}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.continueGradient}
        >
          <Text style={styles.continueButtonText}>Go to Dashboard</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={styles.autoNavigateHint}>
        Click the button above to continue to your dashboard
      </Text>
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

        {step < 6 && <StepIndicator currentStep={step - 1} totalSteps={totalSteps - 1} />}

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

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES
  // ============================================================
  containerDesktop: {
    backgroundColor: '#F8F9FC',
  },
  headerDesktop: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  contentDesktop: {
    paddingHorizontal: 24,
  },
  contentContainerDesktop: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 100,
  },
  navigationBarDesktop: {
    paddingHorizontal: 24,
  },
  stepContainerDesktop: {
    paddingTop: 10,
  },
  businessTypesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  categoriesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  formContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  wizardContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  verificationContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  uploadBoxContainerDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  continueButtonDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  successFeaturesDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8ECF4',
  },
  stepDotActive: {
    width: 24,
    backgroundColor: '#4A7DFF',
  },
  stepDotCompleted: {
    backgroundColor: '#4A7DFF',
  },
  stepContainer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIcon: {
    fontSize: 32,
  },
  stepTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  businessTypesGrid: {
    gap: 12,
  },
  businessTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  businessTypeCardSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  businessTypeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  businessTypeIcon: {
    fontSize: 22,
  },
  businessTypeLabel: {
    color: '#1F2F5F',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  businessTypeDescription: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  categoryCard: {
    width: (width - 58) / 3,
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#4A7DFF',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  categoryLabel: {
    color: '#1F2F5F',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F2F5F',
    fontSize: 15,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  wizardContainer: {
    gap: 16,
  },
  wizardQuestion: {
    gap: 8,
  },
  wizardQuestionLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  wizardInput: {
    backgroundColor: '#F8F9FC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1F2F5F',
    fontSize: 15,
  },
  verificationContainer: {
    gap: 12,
    marginVertical: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  verificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '600',
  },
  verificationDesc: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  documentsSectionTitle: {
    color: '#1F2F5F',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  documentsSectionSubtitle: {
    color: '#8A8AAE',
    fontSize: 13,
    marginBottom: 16,
  },
  uploadBoxContainer: {
    gap: 12,
    marginBottom: 16,
  },
  uploadBox: {
    backgroundColor: '#F8F9FC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  uploadBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadBoxIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadBoxInfo: {
    flex: 1,
  },
  uploadBoxLabel: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadBoxDescription: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  requiredStar: {
    color: '#E74C3C',
  },
  uploadBoxDropZone: {
    borderWidth: 2,
    borderColor: '#DCE5FF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFBFF',
    minHeight: 120,
  },
  uploadBoxDropText: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  uploadBoxDropSubtext: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 4,
  },
  uploadBoxPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  uploadBoxImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  uploadBoxFileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadBoxFileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  uploadBoxFileName: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadBoxFileSize: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },
  uploadBoxRemove: {
    padding: 4,
  },
  uploadBoxProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  uploadBoxProgressText: {
    color: '#4A7DFF',
    fontSize: 14,
  },
  verificationNote: {
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
  verificationNoteText: {
    flex: 1,
    color: '#8A8AAE',
    fontSize: 12,
    lineHeight: 18,
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
  continueButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 16,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    color: '#1F2F5F',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#8A8AAE',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  successFeatures: {
    gap: 12,
    marginBottom: 32,
  },
  successFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successFeatureTitle: {
    color: '#1F2F5F',
    fontSize: 14,
    fontWeight: '500',
  },
  successFeatureDesc: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  autoNavigateHint: {
    color: '#8A8AAE',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
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