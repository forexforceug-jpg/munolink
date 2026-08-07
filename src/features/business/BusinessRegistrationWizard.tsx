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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Json } from '../../types/database.types';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width, height } = Dimensions.get('window');

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
    { key: 'brands', label: 'What brands do you sell?', placeholder: 'e.g. Samsung, Apple, Nike' },
    { key: 'warranty', label: 'Do you offer warranty?', type: 'select', options: ['Yes - 12 months', 'Yes - 24 months', 'No'] },
    { key: 'delivery', label: 'Do you offer delivery?', type: 'select', options: ['Yes - Free', 'Yes - Paid', 'No'] },
    { key: 'pickup', label: 'Is in-store pickup available?', type: 'select', options: ['Yes', 'No'] },
    { key: 'business_hours', label: 'Business Hours', placeholder: 'e.g. Mon-Fri 8AM-8PM, Sat 9AM-6PM' },
  ],
  services: [
    { key: 'service_type', label: 'What type of services do you offer?', placeholder: 'e.g. Repairs, Consultations' },
    { key: 'experience', label: 'Years of experience?', placeholder: 'e.g. 5 years' },
    { key: 'certification', label: 'Do you have certifications?', type: 'select', options: ['Yes - Licensed', 'Yes - Certified', 'No'] },
    { key: 'availability', label: 'When are you available?', placeholder: 'e.g. Mon-Fri 9AM-6PM, Sat 10AM-4PM' },
    { key: 'service_area', label: 'What areas do you cover?', placeholder: 'e.g. Jinja, Kampala' },
  ],
  menu: [
    { key: 'cuisine', label: 'What type of cuisine?', placeholder: 'e.g. Italian, Local, Chinese' },
    { key: 'delivery', label: 'Do you offer delivery?', type: 'select', options: ['Yes - Free', 'Yes - Paid', 'No'] },
    { key: 'reservations', label: 'Do you accept reservations?', type: 'select', options: ['Yes', 'No'] },
    { key: 'dietary_options', label: 'Do you have dietary options?', placeholder: 'e.g. Vegetarian, Gluten-free' },
    { key: 'operating_hours', label: 'Operating Hours', placeholder: 'e.g. Mon-Sun 10AM-10PM' },
  ],
  hotel: [
    { key: 'room_types', label: 'What room types do you have?', placeholder: 'e.g. Standard, Deluxe, Suite' },
    { key: 'amenities', label: 'What amenities do you offer?', placeholder: 'e.g. Pool, Gym, Restaurant' },
    { key: 'check_in', label: 'Check-in time?', placeholder: 'e.g. 2:00 PM' },
    { key: 'check_out', label: 'Check-out time?', placeholder: 'e.g. 12:00 PM' },
    { key: 'parking', label: 'Do you offer parking?', type: 'select', options: ['Yes - Free', 'Yes - Paid', 'No'] },
  ],
  institution: [
    { key: 'service_type', label: 'What services do you offer?', placeholder: 'e.g. Education, Healthcare' },
    { key: 'operating_hours', label: 'Operating Hours', placeholder: 'e.g. Mon-Fri 8AM-6PM' },
    { key: 'capacity', label: 'What is your capacity?', placeholder: 'e.g. 100 students, 50 beds' },
    { key: 'certification', label: 'Do you have certifications?', type: 'select', options: ['Yes - Licensed', 'Yes - Accredited', 'No'] },
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
}

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

const WizardQuestion = ({ question, value, onChange }: any) => {
  const [customText, setCustomText] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setCustomText(value);
    }
  }, [value]);

  const handleChange = (text: string) => {
    setCustomText(text);
    onChange(text);
  };

  if (question.type === 'select') {
    return (
      <View style={styles.wizardQuestion}>
        <Text style={styles.wizardQuestionLabel}>{question.label}</Text>
        <View style={styles.selectOptions}>
          {question.options.map((option: string) => (
            <TouchableOpacity
              key={option}
              style={[styles.selectOption, value === option && styles.selectOptionSelected]}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.selectOptionText, value === option && styles.selectOptionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
        onChangeText={handleChange}
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
          {preview ? (
            <Image source={{ uri: preview }} style={styles.uploadBoxImage} />
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
          onPress={() => onUpload(docType)}
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

// --- Main Component ---
export const BusinessRegistrationWizard = ({ navigation }: any) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Document upload states
  const [documents, setDocuments] = useState<Record<string, DocumentUpload>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  // --- Document Upload Functions ---
  const pickDocument = async (docType: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      console.log('Document pick result:', result);

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
      }

      if (file) {
        console.log('📄 Document picked:', file);
        
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
        console.log('No document selected or cancelled');
      }
    } catch (error) {
      console.error('Document pick error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const uploadDocument = async (docType: string, file: any) => {
    try {
      setUploadingDoc(docType);
      
      const userId = user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please sign in first');
        setUploadingDoc(null);
        return;
      }

      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${userId}/${docType}_${Date.now()}.${fileExt}`;
      const filePath = `business_documents/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      const { data, error } = await supabase.storage
        .from('business_documents')
        .upload(filePath, blob, {
          contentType: file.mimeType || 'application/pdf',
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('business_documents')
        .getPublicUrl(filePath);

      setDocuments(prev => ({
        ...prev,
        [docType]: { 
          ...prev[docType], 
          uri: publicUrl,
          uploaded: true,
          progress: 100 
        }
      }));

      console.log('✅ Document uploaded successfully:', publicUrl);
      Alert.alert('Success', `${docType} document uploaded successfully!`);

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload document. Please try again.');
      
      setDocuments(prev => ({
        ...prev,
        [docType]: { ...prev[docType], progress: 0, uploaded: false }
      }));
    } finally {
      setUploadingDoc(null);
    }
  };

  const pickImage = async (docType: string) => {
    try {
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
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showDocumentOptions = (docType: string) => {
    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        { text: 'Choose from Files', onPress: () => pickDocument(docType) },
        { text: 'Take Photo', onPress: () => pickImage(docType) },
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
          onPress: () => {
            setDocuments(prev => ({
              ...prev,
              [docType]: { uri: '', name: '', type: '', uploaded: false, progress: 0 }
            }));
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

    // Check if required documents are uploaded
    const docRequirements = getDocumentRequirements();
    const requiredDocs = docRequirements.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.id]?.uploaded);
    
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
      console.log('📝 Business Name:', businessName);
      console.log('📝 Business Type:', businessType);
      console.log('📝 Category:', category);

      // Check if user exists
      const { data: userById, error: checkByIdError } = await supabase
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

      // Insert into shops
      console.log('📝 Creating shop...');
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id: userId,
          name: businessName.trim(),
          area: businessAddress.trim() || null,
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

      console.log('✅ Shop created with ID:', shopData.id);

      // Insert into verification_requests
      console.log('📝 Creating verification request...');
      const { error: verificationError } = await supabase
        .from('verification_requests')
        .insert({
          business_id: shopData.id,
          requested_by: userId,
          status: 'pending',
          verification_type: 'business_verification',
        });

      if (verificationError) {
        console.error('❌ VERIFICATION INSERT ERROR:', verificationError);
        throw verificationError;
      }

      console.log('✅ Verification request created');

      // Save document URLs to AsyncStorage
      const docUrls: Record<string, string> = {};
      Object.keys(documents).forEach(key => {
        if (documents[key]?.uploaded) {
          docUrls[key] = documents[key].uri;
        }
      });
      
      await AsyncStorage.setItem(`documents_${shopData.id}`, JSON.stringify({
        ...docUrls,
        uploadedAt: new Date().toISOString(),
      }));

      // Update user role
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
    <View style={styles.stepContainer}>
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

      <View style={styles.businessTypesGrid}>
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
      <View style={styles.stepContainer}>
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

        <View style={styles.categoriesGrid}>
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
    <View style={styles.stepContainer}>
      <View style={styles.stepIconContainer}>
        <LinearGradient
          colors={['#4A7DFF', '#6B94FF']}
          style={styles.stepIconGradient}
        >
          <Text style={styles.stepIcon}>📝</Text>
        </LinearGradient>
      </View>

      <Text style={styles.stepTitle}>What do you call it?</Text>
      <Text style={styles.stepSubtitle}>
        Tell us about your business identity
      </Text>

      <View style={styles.formContainer}>
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
          <Text style={styles.formLabel}>Location</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Where can customers find you?"
            placeholderTextColor="#8A8AAE"
            value={businessAddress}
            onChangeText={setBusinessAddress}
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
        <View style={styles.stepContainer}>
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
      <View style={styles.stepContainer}>
        <View style={styles.stepIconContainer}>
          <LinearGradient
            colors={['#4A7DFF', '#6B94FF']}
            style={styles.stepIconGradient}
          >
            <Text style={styles.stepIcon}>⚙️</Text>
          </LinearGradient>
        </View>

        <Text style={styles.stepTitle}>Let's customize it for your category</Text>
        <Text style={styles.stepSubtitle}>
          This helps us create a better experience for your customers
        </Text>

        <View style={styles.wizardContainer}>
          {questions.map((q) => (
            <WizardQuestion
              key={q.key}
              question={q}
              value={wizardAnswers[q.key] || ''}
              onChange={(value: string) =>
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
      <View style={styles.stepContainer}>
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

        <View style={styles.verificationContainer}>
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

        <View style={styles.uploadBoxContainer}>
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
            />
          ))}
        </View>

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
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
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

      <View style={styles.successFeatures}>
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

      <TouchableOpacity style={styles.continueButton} onPress={handleFinish}>
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
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
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>

        {step < 6 && (
          <View style={styles.navigationBar}>
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

const styles = StyleSheet.create({
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
  selectOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FC',
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  selectOptionSelected: {
    backgroundColor: 'rgba(74, 125, 255, 0.08)',
    borderColor: '#4A7DFF',
  },
  selectOptionText: {
    color: '#8A8AAE',
    fontSize: 13,
  },
  selectOptionTextSelected: {
    color: '#4A7DFF',
    fontWeight: '500',
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
});