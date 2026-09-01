// src/features/opportunity/scenes/GalleryScene.tsx

import React, { useState, useRef, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Scene } from '../types/Scene';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface GalleryItem {
  type: 'image' | 'video';
  uri: string;
  thumbnail?: string;
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
  const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<Video>(null);

  // Get gallery items from scene data
  const galleryImages = (scene.data?.images || []) as string[];
  const videoUri = scene.data?.video || null;

  // Build gallery items list
  const items: GalleryItem[] = [
    ...galleryImages.map((uri: string) => ({ type: 'image' as const, uri })),
  ];

  if (videoUri) {
    items.push({ type: 'video' as const, uri: videoUri });
  }

  const totalImages = galleryImages.length;
  const hasVideo = !!videoUri;
  const canAddImage = totalImages < MAX_IMAGES;
  const canAddVideo = !hasVideo;

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
    if (!editable || !onAddVideo) return;
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

  // --- Handle Item Press ---
  const handleItemPress = (item: GalleryItem, index: number) => {
    if (item.type === 'image') {
      setSelectedItem(item);
      setModalVisible(true);
    } else if (item.type === 'video') {
      setSelectedItem(item);
      setModalVisible(true);
    }
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

  // --- Render Modal ---
  const renderModal = () => {
    if (!selectedItem) return null;

    const isVideo = selectedItem.type === 'video';

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
          if (videoRef.current) {
            videoRef.current.pauseAsync();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => {
              setModalVisible(false);
              setSelectedItem(null);
              if (videoRef.current) {
                videoRef.current.pauseAsync();
              }
            }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {isVideo ? (
            <View style={styles.modalVideoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: selectedItem.uri }}
                style={styles.modalVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => setVideoStatus(status)}
              />
              {videoStatus?.isLoaded && !videoStatus?.isPlaying && (
                <TouchableOpacity
                  style={styles.videoPlayButton}
                  onPress={() => {
                    if (videoRef.current) {
                      videoRef.current.playAsync();
                    }
                  }}
                >
                  <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Image
              source={{ uri: selectedItem.uri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
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
            <Ionicons name="images-outline" size={24} color="#FFFFFF" />
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
            <Ionicons name="videocam-outline" size={24} color="#FFFFFF" />
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

  // --- Layout Logic ---
  const itemCount = items.length;

  // For 1 item: full width, aspect ratio 16:9
  if (itemCount === 1) {
    return (
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        <TouchableOpacity
          style={styles.singleItem}
          onPress={() => handleItemPress(items[0], 0)}
          activeOpacity={0.9}
        >
          {items[0].type === 'image' ? (
            <Image
              source={{ uri: items[0].uri }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.videoThumbnail}>
              <Video
                ref={videoRef}
                source={{ uri: items[0].uri }}
                style={styles.videoThumbnailPlayer}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
              />
              <View style={styles.videoPlayOverlay}>
                <Ionicons name="play-circle" size={48} color="#FFFFFF" />
              </View>
            </View>
          )}
          {editable && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveItem(0);
              }}
            >
              <Ionicons name="close-circle" size={24} color="#E74C3C" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {editable && renderAddButtons()}
        {renderModal()}
      </View>
    );
  }

  // For 2 items: side by side, each 50% width
  if (itemCount === 2) {
    return (
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        <View style={styles.twoColumnContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.twoColumnItem}
              onPress={() => handleItemPress(item, index)}
              activeOpacity={0.9}
            >
              {item.type === 'image' ? (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.twoColumnImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.videoThumbnailSmall}>
                  <Video
                    source={{ uri: item.uri }}
                    style={styles.videoThumbnailSmallPlayer}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                  />
                  <View style={styles.videoPlayOverlaySmall}>
                    <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                  </View>
                </View>
              )}
              {editable && (
                <TouchableOpacity
                  style={styles.removeButtonSmall}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(index);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
        {editable && renderAddButtons()}
        {renderModal()}
      </View>
    );
  }

  // For 3+ items: grid layout
  return (
    <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
      <ScrollView
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {items.map((item, index) => {
            const isFirst = index === 0 && itemCount === 3;
            const gridStyle = isFirst
              ? styles.gridItemLarge
              : styles.gridItemSmall;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.gridItem, gridStyle]}
                onPress={() => handleItemPress(item, index)}
                activeOpacity={0.9}
              >
                {item.type === 'image' ? (
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.videoThumbnailGrid}>
                    <Video
                      source={{ uri: item.uri }}
                      style={styles.videoThumbnailGridPlayer}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                    />
                    <View style={styles.videoPlayOverlayGrid}>
                      <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                    </View>
                  </View>
                )}
                {editable && (
                  <TouchableOpacity
                    style={styles.removeButtonGrid}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(index);
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  </TouchableOpacity>
                )}
                {index === 0 && itemCount > 3 && (
                  <View style={styles.imageCountBadge}>
                    <Text style={styles.imageCountText}>
                      +{itemCount - 1}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {editable && renderAddButtons()}
      </ScrollView>
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

  // Single item
  singleItem: {
    flex: 1,
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnail: {
    flex: 1,
    position: 'relative',
  },
  videoThumbnailPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Two column
  twoColumnContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  twoColumnItem: {
    flex: 1,
    position: 'relative',
    margin: 1,
  },
  twoColumnImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailSmall: {
    flex: 1,
    position: 'relative',
  },
  videoThumbnailSmallPlayer: {
    width: '100%',
    height: '100%',
  },
  videoPlayOverlaySmall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  // Grid
  gridScrollContent: {
    flexGrow: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 1,
  },
  gridItem: {
    position: 'relative',
    padding: 1,
  },
  gridItemLarge: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  gridItemSmall: {
    width: '50%',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoThumbnailGrid: {
    flex: 1,
    position: 'relative',
  },
  videoThumbnailGridPlayer: {
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

  // Badge
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Add buttons
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

  // Remove buttons
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
  },
  removeButtonSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  removeButtonGrid: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
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
});