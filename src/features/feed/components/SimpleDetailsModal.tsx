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
}

export const SimpleDetailsModal: React.FC<SimpleDetailsModalProps> = ({
  visible,
  opportunity,
  onClose,
}) => {
  if (!opportunity) return null;

  const formatPrice = (price: number) => `UGX ${price.toLocaleString()}`;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Drag Indicator */}
          <View style={styles.dragContainer}>
            <View style={styles.dragBar} />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8A8AAE" />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2A4F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.85,
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  dragContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
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
    borderRadius: 10,
    marginRight: 12,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
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
    color: '#8A8AAE',
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
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 6,
  },
  chipLabel: {
    color: '#8A8AAE',
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
    color: '#8A8AAE',
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
    color: '#8A8AAE',
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
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
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