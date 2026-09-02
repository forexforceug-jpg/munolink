// src/features/opportunity/scenes/GalleryScene.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Scene } from '../types/Scene';

// ✅ Safely import expo-av with error handling
let Video: any = null;
let ResizeMode: any = null;
let AVPlaybackStatus: any = null;
let VideoAvailable = false;

try {
  const expoAv = require('expo-av');
  Video = expoAv.Video;
  ResizeMode = expoAv.ResizeMode;
  AVPlaybackStatus = expoAv.AVPlaybackStatus;
  VideoAvailable = true;
} catch (e) {
  console.warn('⚠️ expo-av not available, video support disabled');
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GalleryItem {
  type: 'image' | 'video';
  uri: string;
  thumbnail?: string;
  id?: string;
}

interface Props {
  scene: Scene;
  width?: number;
  height?: number;
  onAddImage?: (uri: string) => void;
  onAddVideo?: (uri: string) => void;
  onRemoveItem?: (index: number) => void;
  editable?: boolean;
}

const MAX_IMAGES = 6;
const MAX_VIDEOS = 1;
const MAX_VIDEO_SIZE_MB = 30;
const MAX_VIDEO_DURATION_SECONDS = 120; // 2 minutes

export function GalleryScene({
  scene,
  width,
  height,
  onAddImage,
  onAddVideo,
  onRemoveItem,
  editable = false,
}: Props) {
  const containerWidth = width || screenWidth;
  const containerHeight = height || screenHeight;
  const isDesktop = Platform.OS === 'web';

  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [videoStatus, setVideoStatus] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<any>(null);

  // Get gallery items from scene data
  const galleryImages = (scene.data?.images || []) as string[];
  const videoUri = scene.data?.video || null;

  // Build gallery items list - only add video if expo-av is available
  const items: GalleryItem[] = [
    ...galleryImages.map((uri: string, index: number) => ({ 
      type: 'image' as const, 
      uri,
      id: `image-${index}`,
    })),
  ];

  // Only add video if expo-av is available
  if (videoUri && VideoAvailable) {
    items.push({ type: 'video' as const, uri: videoUri, id: 'video-0' });
  }

  const totalImages = galleryImages.length;
  const hasVideo = !!videoUri && VideoAvailable;
  const canAddImage = totalImages < MAX_IMAGES;
  const canAddVideo = !hasVideo && VideoAvailable;

  // --- Error boundary ---
  useEffect(() => {
    if (hasError) {
      console.warn('GalleryScene encountered an error, showing fallback');
    }
  }, [hasError]);

  // --- Handle Image Upload ---
  const handleAddImage = async () => {
    if (!editable || !onAddImage) return;
    if (totalImages >= MAX_IMAGES) {
      Alert.alert('Maximum Images', `You can only add up to ${MAX_IMAGES} images.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        await onAddImage(result.assets[0].uri);
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image.');
      setUploading(false);
    }
  };

  // --- Handle Video Upload ---
  const handleAddVideo = async () => {
    if (!editable || !onAddVideo || !VideoAvailable) return;
    if (hasVideo) {
      Alert.alert('Video Exists', 'You can only add one video.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
          Alert.alert(
            'Video Too Large',
            `Video size exceeds ${MAX_VIDEO_SIZE_MB}MB limit. Please compress the video.`
          );
          return;
        }

        if (asset.duration && asset.duration > MAX_VIDEO_DURATION_SECONDS) {
          Alert.alert(
            'Video Too Long',
            `Video duration exceeds ${MAX_VIDEO_DURATION_SECONDS / 60} minutes limit.`
          );
          return;
        }

        setUploading(true);
        await onAddVideo(asset.uri);
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video.');
      setUploading(false);
    }
  };

  // --- Handle Item Press - Open in Modal ---
  const handleItemPress = (item: GalleryItem, index: number) => {
    // ✅ Prevent event bubbling to parent
    setSelectedItem(item);
    setModalVisible(true);
    setVideoError(false);
  };

  // --- Handle Remove Item ---
  const handleRemoveItem = (index: number) => {
    if (!editable || !onRemoveItem) return;
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveItem(index) }
      ]
    );
  };

  // --- Render Video Thumbnail ---
  const renderVideoThumbnail = (uri: string, size: number) => {
    if (!VideoAvailable) {
      return (
        <View style={[styles.videoThumbnailCard, { width: size, height: size }]}>
          <Ionicons name="videocam-outline" size={32} color="#8A8AAE" />
          <Text style={styles.videoUnavailableText}>Video unavailable</Text>
        </View>
      );
    }

    return (
      <View style={[styles.videoThumbnailCard, { width: size, height: size }]}>
        <Video
          source={{ uri }}
          style={styles.videoThumbnailPlayer}
          resizeMode={ResizeMode?.COVER || 'cover'}
          shouldPlay={false}
          isLooping={false}
          onError={(error: any) => {
            console.warn('Video error:', error);
            setVideoError(true);
          }}
        />
        <View style={styles.videoPlayOverlayGrid}>
          <View style={styles.videoPlayButtonCircle}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.videoBadgeText}>Video</Text>
        </View>
      </View>
    );
  };

  // --- Render Modal ---
  const renderModal = () => {
    if (!selectedItem) return null;

    const isVideo = selectedItem.type === 'video' && VideoAvailable;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
          if (videoRef.current) {
            try {
              videoRef.current.pauseAsync();
            } catch (e) {
              // Ignore
            }
          }
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setModalVisible(false);
            setSelectedItem(null);
            if (videoRef.current) {
              try {
                videoRef.current.pauseAsync();
              } catch (e) {
                // Ignore
              }
            }
          }}
        >
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setModalVisible(false);
              setSelectedItem(null);
              if (videoRef.current) {
                try {
                  videoRef.current.pauseAsync();
                } catch (e) {
                  // Ignore
                }
              }
            }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {items.length > 1 && (
            <>
              <TouchableOpacity
                style={styles.modalCounter}
                onPress={(e) => {
                  e.stopPropagation();
                  const currentIndex = items.findIndex(item => item.id === selectedItem.id);
                  if (currentIndex > 0) {
                    setSelectedItem(items[currentIndex - 1]);
                    setVideoError(false);
                  }
                }}
              >
                <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCounterRight}
                onPress={(e) => {
                  e.stopPropagation();
                  const currentIndex = items.findIndex(item => item.id === selectedItem.id);
                  if (currentIndex < items.length - 1) {
                    setSelectedItem(items[currentIndex + 1]);
                    setVideoError(false);
                  }
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.modalContentWrapper}>
            {isVideo && VideoAvailable ? (
              <View style={styles.modalVideoContainer}>
                <Video
                  ref={videoRef}
                  source={{ uri: selectedItem.uri }}
                  style={styles.modalVideo}
                  useNativeControls
                  resizeMode={ResizeMode?.CONTAIN || 'contain'}
                  isLooping={false}
                  onPlaybackStatusUpdate={(status: any) => setVideoStatus(status)}
                  onError={(error: any) => {
                    console.warn('Modal video error:', error);
                    setVideoError(true);
                  }}
                />
                {videoStatus?.isLoaded && !videoStatus?.isPlaying && (
                  <TouchableOpacity
                    style={styles.videoPlayButton}
                    onPress={() => {
                      if (videoRef.current) {
                        try {
                          videoRef.current.playAsync();
                        } catch (e) {
                          // Ignore
                        }
                      }
                    }}
                  >
                    <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                  </TouchableOpacity>
                )}
                {videoError && (
                  <View style={styles.videoErrorOverlay}>
                    <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
                    <Text style={styles.videoErrorText}>Failed to play video</Text>
                  </View>
                )}
              </View>
            ) : (
              <Image
                source={{ uri: selectedItem.uri }}
                style={styles.modalImage}
                resizeMode="contain"
                onError={() => {
                  console.warn('Failed to load image in modal');
                }}
              />
            )}
          </View>

          {/* Modal bottom info */}
          <View style={styles.modalBottomInfo}>
            <Text style={styles.modalItemCount}>
              {items.findIndex(item => item.id === selectedItem.id) + 1} / {items.length}
            </Text>
            <Text style={styles.modalItemType}>
              {isVideo ? '🎬 Video' : '🖼️ Image'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // --- Render Add Buttons ---
  const renderAddButtons = () => {
    if (!editable) return null;

    return (
      <View style={styles.addButtonsContainer}>
        {canAddImage && (
          <TouchableOpacity
            style={[styles.addButton, styles.addImageButton]}
            onPress={handleAddImage}
            disabled={uploading}
          >
            <Ionicons name="images-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>
              Add Image ({totalImages}/{MAX_IMAGES})
            </Text>
          </TouchableOpacity>
        )}
        {canAddVideo && (
          <TouchableOpacity
            style={[styles.addButton, styles.addVideoButton]}
            onPress={handleAddVideo}
            disabled={uploading}
          >
            <Ionicons name="videocam-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Video</Text>
          </TouchableOpacity>
        )}
        {uploading && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#4A7DFF" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </View>
    );
  };

  // --- Calculate grid item size ---
  const getGridItemSize = () => {
    const numColumns = 3;
    const padding = 8;
    const totalPadding = padding * (numColumns + 1);
    const itemSize = (containerWidth - totalPadding) / numColumns;
    return Math.min(itemSize, 200);
  };

  // --- Render Grid Item ---
  const renderGridItem = ({ item, index }: { item: GalleryItem; index: number }) => {
    const itemSize = getGridItemSize();

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          {
            width: itemSize,
            height: itemSize,
            margin: 4,
          }
        ]}
        onPress={() => handleItemPress(item, index)}
        activeOpacity={0.8}
      >
        {item.type === 'image' ? (
          <Image
            source={{ uri: item.uri }}
            style={styles.gridCardImage}
            resizeMode="cover"
            onError={() => console.warn('Failed to load image')}
          />
        ) : (
          renderVideoThumbnail(item.uri, itemSize)
        )}
        
        {editable && (
          <TouchableOpacity
            style={styles.removeButtonGrid}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveItem(index);
            }}
          >
            <Ionicons name="close-circle" size={22} color="#E74C3C" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // --- Error fallback ---
  if (hasError) {
    return (
      <View style={[styles.container, { 
        width: containerWidth, 
        height: containerHeight,
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
        <Ionicons name="image-outline" size={48} color="#8A8AAE" />
        <Text style={styles.errorText}>Gallery unavailable</Text>
      </View>
    );
  }

  // --- Render Empty State ---
  if (items.length === 0 && !editable) {
    return (
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color="#8A8AAE" />
          <Text style={styles.emptyText}>No gallery items</Text>
        </View>
      </View>
    );
  }

  // --- Main Grid Layout ---
  return (
    <View 
      style={[styles.container, { width: containerWidth, height: containerHeight }]}
      // ✅ Prevent parent PanResponder from capturing touches
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    >
      <ScrollView
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator={false}
        // ✅ Prevent scroll events from bubbling
        scrollEventThrottle={16}
      >
        {items.length > 0 ? (
          <View style={styles.gridContainer}>
            {items.map((item, index) => renderGridItem({ item, index }))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color="#8A8AAE" />
            <Text style={styles.emptyText}>No gallery items</Text>
          </View>
        )}
        
        {editable && (
          <View style={styles.editableAddContainer}>
            {canAddImage && (
              <TouchableOpacity
                style={[styles.addCard, styles.addImageCard]}
                onPress={handleAddImage}
                disabled={uploading}
              >
                <Ionicons name="add-circle-outline" size={32} color="#4A7DFF" />
                <Text style={styles.addCardText}>Add Image</Text>
                <Text style={styles.addCardSubtext}>{totalImages}/{MAX_IMAGES}</Text>
              </TouchableOpacity>
            )}
            {canAddVideo && (
              <TouchableOpacity
                style={[styles.addCard, styles.addVideoCard]}
                onPress={handleAddVideo}
                disabled={uploading}
              >
                <Ionicons name="videocam-outline" size={32} color="#E74C3C" />
                <Text style={styles.addCardText}>Add Video</Text>
                <Text style={styles.addCardSubtext}>Max 30MB, 2min</Text>
              </TouchableOpacity>
            )}
            {uploading && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator size="small" color="#4A7DFF" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal for fullscreen view */}
      {renderModal()}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D0D1A',
    position: 'relative',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D1A',
  },
  emptyText: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#8A8AAE',
    fontSize: 16,
    marginTop: 8,
  },

  // Grid Layout
  gridScrollContent: {
    padding: 8,
    paddingBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 8,
  },
  gridCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },

  // Video Thumbnail
  videoThumbnailCard: {
    position: 'relative',
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnailPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlayGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlayButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeText: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoUnavailableText: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 4,
  },

  // Remove button on grid items
  removeButtonGrid: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 2,
  },

  // Add buttons (editable mode)
  editableAddContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  addCard: {
    width: '48%',
    minWidth: 100,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.02)',
    minHeight: 80,
  },
  addImageCard: {
    borderColor: '#4A7DFF',
  },
  addVideoCard: {
    borderColor: '#E74C3C',
  },
  addCardText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  addCardSubtext: {
    color: '#8A8AAE',
    fontSize: 10,
    marginTop: 2,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addImageButton: {
    backgroundColor: 'rgba(74, 125, 255, 0.3)',
    borderWidth: 1,
    borderColor: '#4A7DFF',
  },
  addVideoButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadingText: {
    color: '#8A8AAE',
    fontSize: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  modalCounter: {
    position: 'absolute',
    top: '50%',
    left: 16,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  modalCounterRight: {
    position: 'absolute',
    top: '50%',
    right: 16,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  modalContentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalVideoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  videoErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  modalBottomInfo: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalItemCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  modalItemType: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
});