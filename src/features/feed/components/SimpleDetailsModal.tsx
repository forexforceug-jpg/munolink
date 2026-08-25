// src/features/feed/components/SimpleDetailsModal.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Opportunity } from '../../../services/feed.service';

const { width, height } = Dimensions.get('window');

interface SimpleDetailsModalProps {
  visible: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  isDesktopView?: boolean;
  panelWidth?: number;
}

export const SimpleDetailsModal: React.FC<SimpleDetailsModalProps> = ({
  visible,
  opportunity,
  onClose,
  isDesktopView = false,
}) => {
  if (!opportunity) return null;

  const formatPrice = (price: number) => `UGX ${price.toLocaleString()}`;

  // ============================================================
  // DESKTOP VIEW - Render content directly (no Modal wrapper)
  // ============================================================
  if (isDesktopView) {
    return (
      <View style={styles.desktopContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.desktopScrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={{ uri: opportunity.imageUrl }}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{opportunity.title}</Text>
              <Text style={styles.headerPrice}>
                {formatPrice(opportunity.price)}
              </Text>
              <Text
                style={[
                  styles.headerStatus,
                  { color: opportunity.inStock ? '#2ECC71' : '#E74C3C' },
                ]}
              >
                {opportunity.inStock ? '✅ In Stock' : '❌ Check Availability'}
              </Text>
            </View>
          </View>

          {/* Provider */}
          <View style={styles.providerSection}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerLetter}>
                {opportunity.shopName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{opportunity.shopName}</Text>
              <Text style={styles.providerDetail}>
                ⭐ {opportunity.rating?.toFixed(1) || 'New'} •{' '}
                {opportunity.area || 'Nearby'}
              </Text>
            </View>
          </View>

          {/* Quick Info Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContent}
          >
            {opportunity.specifications &&
              Object.entries(opportunity.specifications)
                .slice(0, 4)
                .map(([key, value]) => (
                  <View key={key} style={styles.chip}>
                    <Text style={styles.chipLabel}>
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.chipValue}>{String(value)}</Text>
                  </View>
                ))}
          </ScrollView>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionText}>
              {opportunity.description ||
                `Premium ${opportunity.title} from ${opportunity.shopName}.`}
            </Text>
          </View>

          {/* Specifications */}
          {opportunity.specifications &&
            Object.keys(opportunity.specifications).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Specifications</Text>
                {Object.entries(opportunity.specifications).map(
                  ([key, value]) => (
                    <View key={key} style={styles.specRow}>
                      <Text style={styles.specLabel}>
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.specValue}>{String(value)}</Text>
                    </View>
                  )
                )}
              </View>
            )}

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.desktopBottomBar}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="#4A7DFF" />
            <Text style={styles.actionBtnText}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="sparkles-outline" size={20} color="#4A7DFF" />
            <Text style={styles.actionBtnText}>AI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="bookmark-outline" size={20} color="#4A7DFF" />
            <Text style={styles.actionBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buyBtn}>
            <LinearGradient
              colors={['#4A7DFF', '#6B94FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buyGradient}
            >
              <Text style={styles.buyText}>Buy Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // MOBILE VIEW - Transparent Glass Modal
  // ============================================================
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Transparent Glass Background */}
        <TouchableOpacity 
          style={styles.modalBackground} 
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          {/* Drag Indicator */}
          <View style={styles.dragContainer}>
            <View style={styles.dragBar} />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={{ uri: opportunity.imageUrl }}
                style={styles.headerImage}
                resizeMode="cover"
              />
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{opportunity.title}</Text>
                <Text style={styles.headerPrice}>
                  {formatPrice(opportunity.price)}
                </Text>
                <Text
                  style={[
                    styles.headerStatus,
                    { color: opportunity.inStock ? '#2ECC71' : '#E74C3C' },
                  ]}
                >
                  {opportunity.inStock ? '✅ In Stock' : '❌ Check Availability'}
                </Text>
              </View>
            </View>

            {/* Provider */}
            <View style={styles.providerSection}>
              <View style={styles.providerAvatar}>
                <Text style={styles.providerLetter}>
                  {opportunity.shopName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{opportunity.shopName}</Text>
                <Text style={styles.providerDetail}>
                  ⭐ {opportunity.rating?.toFixed(1) || 'New'} •{' '}
                  {opportunity.area || 'Nearby'}
                </Text>
              </View>
            </View>

            {/* Quick Info Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {opportunity.specifications &&
                Object.entries(opportunity.specifications)
                  .slice(0, 4)
                  .map(([key, value]) => (
                    <View key={key} style={styles.chip}>
                      <Text style={styles.chipLabel}>
                        {key.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.chipValue}>{String(value)}</Text>
                    </View>
                  ))}
            </ScrollView>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionText}>
                {opportunity.description ||
                  `Premium ${opportunity.title} from ${opportunity.shopName}.`}
              </Text>
            </View>

            {/* Specifications */}
            {opportunity.specifications &&
              Object.keys(opportunity.specifications).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Specifications</Text>
                  {Object.entries(opportunity.specifications).map(
                    ([key, value]) => (
                      <View key={key} style={styles.specRow}>
                        <Text style={styles.specLabel}>
                          {key.replace(/_/g, ' ')}
                        </Text>
                        <Text style={styles.specValue}>{String(value)}</Text>
                      </View>
                    )
                  )}
                </View>
              )}

            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color="#4A7DFF" />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="sparkles-outline" size={20} color="#4A7DFF" />
              <Text style={styles.actionBtnText}>AI</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={20} color="#4A7DFF" />
              <Text style={styles.actionBtnText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buyBtn}>
              <LinearGradient
                colors={['#4A7DFF', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buyGradient}
              >
                <Text style={styles.buyText}>Buy Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ============================================================
  // DESKTOP STYLES
  // ============================================================
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  desktopScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  desktopBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 42, 79, 0.95)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  // ============================================================
  // MOBILE STYLES - Transparent Glass (React Native compatible)
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: 'rgba(26, 42, 79, 0.92)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.82,
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  dragContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  // ============================================================
  // SHARED STYLES
  // ============================================================
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  headerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerPrice: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  providerLetter: {
    color: '#4A7DFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  providerDetail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  chipsScroll: {
    marginBottom: 12,
  },
  chipsContent: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginRight: 6,
  },
  chipLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginRight: 4,
  },
  chipValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 20,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  specLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  specValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26, 42, 79, 0.95)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  actionBtnText: {
    color: '#4A7DFF',
    fontSize: 9,
    marginTop: 1,
  },
  buyBtn: {
    flex: 1.5,
  },
  buyGradient: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});