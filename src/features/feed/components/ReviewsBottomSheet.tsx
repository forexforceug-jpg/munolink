// src/features/feed/components/ReviewsBottomSheet.tsx

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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

const { width, height } = Dimensions.get('window');

interface ReviewsBottomSheetProps {
  visible: boolean;
  productId: string;
  productTitle?: string;
  onClose: () => void;
  panelWidth?: number;
  isDesktopView?: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  images: string[];
  parent_id: string | null;
  helpful_count: number;
  is_edited: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  replies?: Comment[];
}

export const ReviewsBottomSheet: React.FC<ReviewsBottomSheetProps> = ({
  visible,
  productId,
  productTitle,
  onClose,
  isDesktopView = false,
}) => {
  const { user } = useAuth();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchComments = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📱 Fetching comments for post:', productId);

      // ✅ Use 'as any' to bypass TypeScript type checking for the comments table
      const { data: commentsData, error: commentsError } = await (supabase
        .from('comments' as any)
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', productId)
        .is('parent_id', null)
        .order('created_at', { ascending: false }) as any);

      if (commentsError) {
        console.error('❌ Comments fetch error:', commentsError);
        throw commentsError;
      }

      console.log('📱 Comments found:', commentsData?.length || 0);

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        commentsData.map(async (comment: any) => {
          const { data: repliesData, error: repliesError } = await (supabase
            .from('comments' as any)
            .select(`
              *,
              user:user_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true }) as any);

          if (repliesError) {
            console.error('❌ Replies fetch error:', repliesError);
            return { ...comment, replies: [] };
          }

          return {
            ...comment,
            replies: repliesData || [],
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
      setError(error.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (visible && productId) {
      fetchComments();
    }
  }, [visible, productId, fetchComments]);

  const handleSubmitComment = async () => {
    if (!user) {
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const commentData: any = {
        user_id: user.id,
        post_id: productId,
        content: newComment.trim(),
        images: [],
        is_approved: true,
      };

      if (replyTo) {
        commentData.parent_id = replyTo.id;
      }

      const { data, error: insertError } = await (supabase
        .from('comments' as any)
        .insert(commentData)
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single() as any);

      if (insertError) {
        console.error('❌ Error posting comment:', insertError);
        throw insertError;
      }

      if (data) {
        if (replyTo) {
          setComments(prev => prev.map(comment => 
            comment.id === replyTo.id 
              ? { ...comment, replies: [...(comment.replies || []), data] }
              : comment
          ));
          setReplyTo(null);
        } else {
          setComments(prev => [data, ...prev]);
        }
        setNewComment('');
      }

      console.log('✅ Comment posted successfully');
    } catch (error) {
      console.error('❌ Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyPress = (comment: Comment) => {
    setReplyTo(replyTo?.id === comment.id ? null : comment);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      if (diff < 172800000) return 'Yesterday';
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
      return date.toLocaleDateString('en-UG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const renderComment = ({ item, depth = 0 }: { item: Comment; depth?: number }) => {
    const isReply = depth > 0;
    const userFullName = item.user?.full_name || 'User';
    const userAvatar = item.user?.avatar_url || null;
    const initial = userFullName.charAt(0).toUpperCase();

    return (
      <View 
        style={[
          styles.commentCard,
          isReply && styles.replyCard,
          { marginLeft: isReply ? 24 : 0 }
        ]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.userAvatar}>
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} style={styles.userAvatarImage} />
            ) : (
              <Text style={styles.userAvatarText}>{initial}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userFullName}</Text>
            <Text style={styles.commentDate}>{formatDate(item.created_at)}</Text>
          </View>
          {item.is_edited && (
            <Text style={styles.editedBadge}>Edited</Text>
          )}
        </View>

        <Text style={styles.commentContent}>{item.content}</Text>

        {item.images && item.images.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.commentImages}
          >
            {item.images.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.commentImage} />
            ))}
          </ScrollView>
        )}

        <View style={styles.commentFooter}>
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => handleReplyPress(item)}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#8A8AAE" />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
          
          {item.helpful_count > 0 && (
            <TouchableOpacity style={styles.helpfulButton}>
              <Ionicons name="thumbs-up-outline" size={14} color="#8A8AAE" />
              <Text style={styles.helpfulText}>{item.helpful_count}</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.id}>
                {renderComment({ item: reply, depth: depth + 1 })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const CommentInput = () => (
    <View style={styles.commentInputContainer}>
      <TextInput
        style={styles.commentInput}
        placeholder={replyTo ? `Reply to ${replyTo.user?.full_name || 'User'}...` : "Write a comment..."}
        placeholderTextColor="#8A8AAE"
        multiline
        value={newComment}
        onChangeText={setNewComment}
        maxLength={500}
      />
      {replyTo && (
        <TouchableOpacity 
          style={styles.cancelReplyButton}
          onPress={() => setReplyTo(null)}
        >
          <Text style={styles.cancelReplyText}>Cancel</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.sendButton,
          (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled,
        ]}
        onPress={handleSubmitComment}
        disabled={!newComment.trim() || isSubmitting}
      >
        <Ionicons 
          name="send" 
          size={20} 
          color={newComment.trim() && !isSubmitting ? '#4A7DFF' : '#8A8AAE'} 
        />
      </TouchableOpacity>
    </View>
  );

  // ============================================================
  // DESKTOP VIEW
  // ============================================================
  if (isDesktopView) {
    return (
      <View style={styles.desktopContainer}>
        <View style={styles.desktopHeader}>
          <Text style={styles.desktopTitle}>
            {productTitle ? `Comments on ${productTitle}` : 'Comments'}
          </Text>
          <Text style={styles.desktopCommentCount}>{comments.length} comments</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A7DFF" />
            <Text style={styles.loadingText}>Loading comments...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Could not load comments</Text>
            <Text style={styles.errorSubtext}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchComments}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CommentInput />
            <FlatList
              data={comments}
              renderItem={({ item }) => renderComment({ item, depth: 0 })}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.commentsList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color="#8A8AAE" />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                </View>
              }
            />
          </>
        )}
      </View>
    );
  }

  // ============================================================
  // MOBILE VIEW
  // ============================================================
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8A8AAE" />
          </TouchableOpacity>

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            {productTitle && (
              <Text style={styles.modalProductTitle} numberOfLines={1}>
                {productTitle}
              </Text>
            )}
            <Text style={styles.modalCommentCount}>{comments.length} comments</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A7DFF" />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Could not load comments</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchComments}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={comments}
                renderItem={({ item }) => renderComment({ item, depth: 0 })}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.commentsList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-outline" size={48} color="#8A8AAE" />
                    <Text style={styles.emptyTitle}>No comments yet</Text>
                    <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                  </View>
                }
              />
              <CommentInput />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 12,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  desktopTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  desktopCommentCount: {
    color: '#8A8AAE',
    fontSize: 12,
  },

  // ============================================================
  // MOBILE STYLES
  // ============================================================
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
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
  modalHeader: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalProductTitle: {
    color: '#8A8AAE',
    fontSize: 13,
    marginTop: 2,
  },
  modalCommentCount: {
    color: '#8A8AAE',
    fontSize: 12,
    marginTop: 2,
  },

  // ============================================================
  // SHARED STYLES
  // ============================================================
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#8A8AAE',
    fontSize: 14,
    marginTop: 4,
  },

  commentsList: {
    paddingBottom: 8,
  },
  commentCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  replyCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(74,125,255,0.3)',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74,125,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarText: {
    color: '#4A7DFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  commentDate: {
    color: '#8A8AAE',
    fontSize: 11,
  },
  editedBadge: {
    color: '#8A8AAE',
    fontSize: 10,
    marginLeft: 8,
  },
  commentContent: {
    color: '#E8ECF4',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  commentImages: {
    marginBottom: 6,
  },
  commentImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 6,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyButtonText: {
    color: '#8A8AAE',
    fontSize: 12,
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
  repliesContainer: {
    marginTop: 6,
  },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#1A2A4F',
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 80,
    minHeight: 36,
  },
  cancelReplyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelReplyText: {
    color: '#E74C3C',
    fontSize: 12,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});