import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const { width, height } = Dimensions.get('window');

interface ReviewsBottomSheetProps {
  visible: boolean;
  productId: string;
  productTitle?: string;
  onClose: () => void;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  customer_name: string;
  customer_avatar?: string;
  is_verified?: boolean;
  helpful_count?: number;
  images?: string[];
  purchase_date?: string;
  service_booked?: string;
  product_variation?: string;
}

interface RatingDistribution {
  [key: number]: number;
}

export const ReviewsBottomSheet: React.FC<ReviewsBottomSheetProps> = ({
  visible,
  productId,
  productTitle,
  onClose,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Mock AI-generated summary
  const getAISummary = () => {
    const summaries = [
      "Customers consistently praise the camera quality, fast delivery, and seller responsiveness.",
      "Users love the product quality, affordable pricing, and excellent customer support.",
      "Highly rated for reliability, performance, and value for money.",
      "Customers recommend this for its durability, ease of use, and great features.",
      "Positive feedback on product quality, fast shipping, and professional service.",
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  };

  const [aiSummary] = useState(getAISummary());

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'photos', label: 'Photos' },
    { key: 'videos', label: 'Videos' },
    { key: '5star', label: '5★' },
    { key: '4star', label: '4★' },
    { key: 'helpful', label: 'Most Helpful' },
    { key: 'newest', label: 'Newest' },
    { key: 'verified', label: 'Verified Buyers' },
    { key: 'nearby', label: 'Nearby Customers' },
  ];

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📱 Fetching reviews for product:', productId);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, customer_id')
        .eq('business_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (reviewsError) {
        console.error('❌ Reviews fetch error:', reviewsError);
        throw reviewsError;
      }

      console.log('📱 Reviews found:', reviewsData?.length || 0);

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setFilteredReviews([]);
        setAverageRating(0);
        setTotalReviews(0);
        setRatingDistribution({});
        setLoading(false);
        return;
      }

      // Get customer names
      const customerIds = reviewsData
        .map(r => r.customer_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let customerMap: Record<string, string> = {};

      if (customerIds.length > 0) {
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, phone_number')
            .in('id', customerIds);

          if (!usersError && usersData) {
            customerMap = usersData.reduce((acc: Record<string, string>, user: any) => {
              acc[user.id] = user.phone_number || 'Customer';
              return acc;
            }, {});
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch users:', err);
        }
      }

      // Format reviews with mock data for demo
      const formattedReviews: Review[] = reviewsData.map((item: any, index: number) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment || 'No comment provided',
        created_at: item.created_at,
        customer_name: customerMap[item.customer_id] || `User ${index + 1}`,
        is_verified: Math.random() > 0.3,
        helpful_count: Math.floor(Math.random() * 50) + 1,
        purchase_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        images: Math.random() > 0.7 ? ['https://via.placeholder.com/100'] : [],
      }));

      setReviews(formattedReviews);
      setFilteredReviews(formattedReviews);

      // Calculate average
      const sum = formattedReviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / formattedReviews.length;
      setAverageRating(avg);
      setTotalReviews(formattedReviews.length);

      // Calculate rating distribution
      const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      formattedReviews.forEach(r => {
        if (distribution[r.rating] !== undefined) {
          distribution[r.rating]++;
        }
      });
      setRatingDistribution(distribution);
    } catch (error: any) {
      console.error('❌ Error fetching reviews:', error);
      setError(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (visible && productId) {
      fetchReviews();
    }
  }, [visible, productId, fetchReviews]);

  // Filter reviews
  const applyFilter = useCallback((filterKey: string) => {
    setActiveFilter(filterKey);
    let filtered = [...reviews];

    switch (filterKey) {
      case 'photos':
        filtered = filtered.filter(r => r.images && r.images.length > 0);
        break;
      case '5star':
        filtered = filtered.filter(r => r.rating === 5);
        break;
      case '4star':
        filtered = filtered.filter(r => r.rating === 4);
        break;
      case 'verified':
        filtered = filtered.filter(r => r.is_verified);
        break;
      case 'helpful':
        filtered = filtered.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        break;
    }

    setFilteredReviews(filtered);
  }, [reviews]);

  // Handle rating distribution bar width
  const getBarWidth = (count: number) => {
    const max = Math.max(...Object.values(ratingDistribution));
    return max > 0 ? (count / max) * 100 : 0;
  };

  const renderStars = (rating: number, size: number = 14) => {
    return '⭐'.repeat(Math.round(rating));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const handleSubmitReview = async () => {
    if (userRating === 0 || !userComment.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, this would save to Supabase
      const newReview: Review = {
        id: `temp-${Date.now()}`,
        rating: userRating,
        comment: userComment,
        created_at: new Date().toISOString(),
        customer_name: 'You',
        is_verified: true,
        helpful_count: 0,
      };

      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      setFilteredReviews(updatedReviews);

      // Recalculate average
      const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(sum / updatedReviews.length);
      setTotalReviews(updatedReviews.length);

      // Reset form
      setUserRating(0);
      setUserComment('');

      console.log('✅ Review submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render review card
  const renderReviewCard = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.customer_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.customer_name}</Text>
            {item.is_verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.reviewRating}>{renderStars(item.rating)}</Text>
      </View>

      {item.purchase_date && (
        <Text style={styles.purchaseDate}>
          Purchased: {formatDate(item.purchase_date)}
        </Text>
      )}

      <Text style={styles.reviewComment}>{item.comment}</Text>

      {item.images && item.images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.reviewImages}
        >
          {item.images.map((img, i) => (
            <Image key={i} source={{ uri: img }} style={styles.reviewImage} />
          ))}
        </ScrollView>
      )}

      <View style={styles.reviewFooter}>
        <TouchableOpacity style={styles.helpfulButton}>
          <Ionicons name="thumbs-up-outline" size={14} color="#8A8AAE" />
          <Text style={styles.helpfulText}>Helpful ({item.helpful_count || 0})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // AI Insight Card
  const AIInsightCard = ({ text }: { text: string }) => (
    <View style={styles.aiInsightCard}>
      <Ionicons name="sparkles" size={16} color="#4A7DFF" />
      <Text style={styles.aiInsightText}>🤖 {text}</Text>
    </View>
  );

  // Get AI insights
  const getAIInsights = () => {
    const insights = [
      "87% of reviewers mention fast delivery",
      "Most buyers recommend this for photography",
      "Customers rate installation 4.9/5",
      "94% of customers would buy again",
      "Top mention: excellent value for money",
    ];
    return insights[Math.floor(Math.random() * insights.length)];
  };

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
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8A8AAE" />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A7DFF" />
              <Text style={styles.loadingText}>Loading reviews...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Could not load reviews</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchReviews}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Reviews</Text>
                {productTitle && (
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {productTitle}
                  </Text>
                )}
              </View>

              {/* Rating Summary */}
              <View style={styles.ratingSummary}>
                <View style={styles.ratingLeft}>
                  <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                  <Text style={styles.stars}>{renderStars(averageRating, 18)}</Text>
                  <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
                </View>
                <View style={styles.ratingRight}>
                  <Text style={styles.aiSummary}>🤖 {aiSummary}</Text>
                </View>
              </View>

              {/* Rating Distribution */}
              <View style={styles.distributionContainer}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <View key={star} style={styles.distributionRow}>
                    <Text style={styles.distributionLabel}>{star}★</Text>
                    <View style={styles.distributionBar}>
                      <View 
                        style={[
                          styles.distributionFill,
                          { width: `${getBarWidth(ratingDistribution[star] || 0)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.distributionCount}>
                      {ratingDistribution[star] || 0}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Filter Chips */}
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
              >
                {filterOptions.map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    style={[
                      styles.filterChip,
                      activeFilter === filter.key && styles.filterChipActive,
                    ]}
                    onPress={() => applyFilter(filter.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        activeFilter === filter.key && styles.filterChipTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Write a Review */}
              <View style={styles.writeReviewContainer}>
                <Text style={styles.writeReviewTitle}>Write a Review</Text>
                <View style={styles.starSelector}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setUserRating(star)}
                    >
                      <Text style={[styles.starSelectorIcon, userRating >= star && styles.starSelectorActive]}>
                        {userRating >= star ? '⭐' : '☆'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Describe your experience..."
                  placeholderTextColor="#8A8AAE"
                  multiline
                  numberOfLines={3}
                  value={userComment}
                  onChangeText={setUserComment}
                />
                <View style={styles.reviewActions}>
                  <TouchableOpacity style={styles.attachButton}>
                    <Ionicons name="camera-outline" size={20} color="#4A7DFF" />
                    <Text style={styles.attachButtonText}>Attach Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.postButton,
                      (userRating === 0 || !userComment.trim() || isSubmitting) && styles.postButtonDisabled,
                    ]}
                    onPress={handleSubmitReview}
                    disabled={userRating === 0 || !userComment.trim() || isSubmitting}
                  >
                    <Text style={styles.postButtonText}>
                      {isSubmitting ? 'Posting...' : 'Post Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* AI Insight */}
              <AIInsightCard text={getAIInsights()} />

              {/* Reviews List */}
              <FlatList
                data={filteredReviews}
                renderItem={renderReviewCard}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                scrollEnabled={false}
                contentContainerStyle={styles.reviewsList}
              />
            </ScrollView>
          )}
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#E74C3C',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorSubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  productTitle: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 2,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  ratingLeft: {
    alignItems: 'center',
  },
  averageRating: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  stars: {
    fontSize: 18,
    marginVertical: 2,
  },
  totalReviews: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  ratingRight: {
    flex: 1,
  },
  aiSummary: {
    color: '#8A8AAE',
    fontSize: 13,
    lineHeight: 18,
  },
  distributionContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  distributionLabel: {
    color: '#8A8AAE',
    fontSize: 12,
    width: 30,
  },
  distributionBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#F1C40F',
    borderRadius: 3,
  },
  distributionCount: {
    color: '#8A8AAE',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
    borderColor: '#4A7DFF',
  },
  filterChipText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#4A7DFF',
  },
  writeReviewContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  writeReviewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  starSelector: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  starSelectorIcon: {
    fontSize: 28,
    color: '#8A8AAE',
  },
  starSelectorActive: {
    color: '#F1C40F',
  },
  reviewInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  reviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachButtonText: {
    color: '#4A7DFF',
    fontSize: 12,
  },
  postButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  aiInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 125, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 125, 255, 0.1)',
  },
  aiInsightText: {
    color: '#8A8AAE',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 125, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#4A7DFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#4A7DFF',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 6,
  },
  verifiedText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  reviewDate: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 1,
  },
  reviewRating: {
    fontSize: 14,
  },
  purchaseDate: {
    color: '#8A8AAE',
    fontSize: 11,
    marginBottom: 4,
  },
  reviewComment: {
    color: '#8A8AAE',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  reviewImages: {
    marginBottom: 6,
  },
  reviewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 6,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpfulText: {
    color: '#8A8AAE',
    fontSize: 12,
  },
});