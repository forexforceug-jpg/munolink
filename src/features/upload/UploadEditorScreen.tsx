// src/features/upload/UploadEditorScreen.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { StyledAlert } from '../feed/components/StyledAlert';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

type PriceType = 'fixed' | 'negotiable' | 'free';

type TextOverlayData = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily?: string;
  backgroundColor?: string | null;
  scale?: number;
  textAlign?: 'left' | 'center' | 'right';
  imageIndex?: number;
};

type EditResult = {
  uri: string;
  type: 'image' | 'video';
  trimStart: number;
  trimEnd: number;
  videoThumbnail: string | null;
  fileSize: number | null;
  textOverlays?: TextOverlayData[];
  extraImages?: string[];
  filter?: string;
};

// ============================================================
// FILTER PRESET COLOR MAP (must stay in sync with UploadCameraScreen)
// ============================================================
const FILTER_TINTS: Record<string, string | null> = {
  none: null,
  warm: 'rgba(255,150,80,0.18)',
  cool: 'rgba(80,150,255,0.18)',
  vintage: 'rgba(200,150,80,0.22)',
  mono: 'rgba(120,120,120,0.25)',
  vivid: 'rgba(255,80,120,0.15)',
};

// ============================================================
// UPLOAD HELPERS
// ============================================================
async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    const r = await fetch(uri);
    return await r.blob();
  }
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error(`Failed to read URI: ${uri}`));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function uploadLocalFile(
  uri: string,
  destinationPath: string,
  contentType: string
): Promise<{ publicUrl: string | null; error: string | null }> {
  try {
    if (Platform.OS === 'web') {
      const blob = await uriToBlob(uri);
      if (!blob || blob.size === 0) {
        return { publicUrl: null, error: 'File is empty' };
      }
      const { error } = await supabase.storage
        .from('catalog-images')
        .upload(destinationPath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: blob.type || contentType,
        });
      if (error) return { publicUrl: null, error: error.message };
      const {
        data: { publicUrl },
      } = supabase.storage.from('catalog-images').getPublicUrl(destinationPath);
      return { publicUrl, error: null };
    }

    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      'https://ffbjvrwkvnwocuyapajo.supabase.co';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!anonKey) return { publicUrl: null, error: 'Missing Supabase anon key' };

    const uploadUrl = `${supabaseUrl}/storage/v1/object/catalog-images/${destinationPath}`;
    const result = await FileSystem.uploadAsync(uploadUrl, uri, {
      httpMethod: 'POST',
      uploadType: (FileSystem as any).FileSystemUploadType?.BINARY_CONTENT
        ? (FileSystem as any).FileSystemUploadType.BINARY_CONTENT
        : 0,
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
    });

    if (result.status < 200 || result.status >= 300) {
      return {
        publicUrl: null,
        error: `Upload failed (HTTP ${result.status}): ${result.body}`,
      };
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('catalog-images').getPublicUrl(destinationPath);
    return { publicUrl, error: null };
  } catch (err: any) {
    return { publicUrl: null, error: err?.message || 'Upload failed' };
  }
}

// ============================================================
// MAIN SCREEN
// ============================================================
export const UploadEditorScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const editResult: EditResult | undefined = route?.params?.editResult;

  // Post fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('fixed');
  const [saving, setSaving] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // ✅ Preview URL state — initially the local URI, replaced with the
  //    public URL once the cover/image uploads complete.
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(
    null
  );

  // ✅ Cache of already-uploaded URLs so we don't re-upload on Post.
  //    For video: just the cover. For images: the whole array.
  const uploadedImagesRef = useRef<string[] | null>(null);
  const uploadedCoverRef = useRef<string | null>(null);

  // StyledAlert
  const [styledAlertConfig, setStyledAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: string;
    iconColor?: string;
    buttons: {
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive' | 'primary';
    }[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showStyledAlert = useCallback(
    (config: {
      title: string;
      message: string;
      icon?: string;
      iconColor?: string;
      buttons: {
        text: string;
        onPress: () => void;
        style?: 'default' | 'cancel' | 'destructive' | 'primary';
      }[];
    }) => {
      setStyledAlertConfig({ visible: true, ...config });
    },
    []
  );

  const hideStyledAlert = useCallback(() => {
    setStyledAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const isFree = priceType === 'free';
  const isVideo = editResult?.type === 'video';

  // Build the list of preview images for the top carousel
  const previewImages = useMemo<string[]>(() => {
    if (!editResult) return [];

    if (editResult.type === 'video') {
      // Prefer the uploaded public URL; fall back to local URI.
      const uri = uploadedPreviewUrl || editResult.videoThumbnail;
      return uri ? [uri] : [];
    }

    // Image posts: show uploaded URLs if available, else local URIs.
    if (uploadedImagesRef.current && uploadedImagesRef.current.length > 0) {
      return uploadedImagesRef.current;
    }
    return [editResult.uri, ...(editResult.extraImages || [])];
  }, [editResult, uploadedPreviewUrl]);

  const activeFilterTint = useMemo(() => {
    if (!editResult?.filter) return null;
    return FILTER_TINTS[editResult.filter] ?? null;
  }, [editResult?.filter]);

  // ============================================================
  // ✅ UPLOAD COVER / IMAGES ON MOUNT so preview shows the real URL
  // ============================================================
  useEffect(() => {
    if (!user?.id || !editResult) return;
    let cancelled = false;

    (async () => {
      // ---- Video: upload cover immediately ----
      if (editResult.type === 'video' && editResult.videoThumbnail) {
        try {
          const tName = `videos/${user.id}/${Date.now()}-thumb-${Math.random()
            .toString(36)
            .slice(2, 8)}.jpg`;
          const tRes = await uploadLocalFile(
            editResult.videoThumbnail,
            tName,
            'image/jpeg'
          );
          if (!cancelled && tRes.publicUrl) {
            uploadedCoverRef.current = tRes.publicUrl;
            setUploadedPreviewUrl(tRes.publicUrl);
          }
        } catch (e) {
          console.warn('Cover upload on mount failed:', e);
        }
        return;
      }

      // ---- Image: upload all images so preview is stable ----
      if (editResult.type === 'image') {
        const all = [editResult.uri, ...(editResult.extraImages || [])];
        const urls: string[] = [];
        for (const uri of all) {
          try {
            const ext = uri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
            const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
            const fileName = `posts/${user.id}/${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}.${ext}`;
            const r = await uploadLocalFile(uri, fileName, contentType);
            if (r.publicUrl) urls.push(r.publicUrl);
          } catch (e) {
            console.warn('Image pre-upload failed:', e);
          }
        }
        if (!cancelled && urls.length > 0) {
          uploadedImagesRef.current = urls;
          setUploadedPreviewUrl(urls[0]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, editResult]);

  // ============================================================
  // PUBLISH
  // ============================================================
  const handlePost = useCallback(async () => {
    if (!user?.id) {
      showStyledAlert({
        title: 'Sign in required',
        message: 'Please sign in to post.',
        icon: 'lock-closed-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (!editResult) {
      showStyledAlert({
        title: 'Error',
        message: 'Missing media.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (!title.trim()) {
      showStyledAlert({
        title: 'Title required',
        message: 'Please add a title.',
        icon: 'alert-circle-outline',
        iconColor: '#4A7DFF',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    if (priceType !== 'free') {
      const num = parseFloat(price);
      if (!num || num <= 0) {
        showStyledAlert({
          title: 'Price required',
          message:
            priceType === 'negotiable'
              ? 'Please enter a starting price.'
              : 'Please enter a valid price.',
          icon: 'alert-circle-outline',
          iconColor: '#4A7DFF',
          buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
        });
        return;
      }
    }

    setSaving(true);
    try {
      // ==========================================================
      // 1. Cover (video) — reuse if already uploaded on mount
      // ==========================================================
      let thumbnailUrl: string | null = uploadedCoverRef.current;

      if (
        editResult.type === 'video' &&
        editResult.videoThumbnail &&
        !thumbnailUrl
      ) {
        const tName = `videos/${user.id}/${Date.now()}-thumb-${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const tRes = await uploadLocalFile(
          editResult.videoThumbnail,
          tName,
          'image/jpeg'
        );
        if (tRes.publicUrl) {
          thumbnailUrl = tRes.publicUrl;
          setUploadedPreviewUrl(tRes.publicUrl);
        }
      }

      // ==========================================================
      // 2. Images — reuse if already uploaded on mount
      // ==========================================================
      let uploadedImages: string[] = uploadedImagesRef.current || [];

      if (editResult.type === 'image' && uploadedImages.length === 0) {
        const allImages = [editResult.uri, ...(editResult.extraImages || [])];
        for (const uri of allImages) {
          try {
            const ext = uri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
            const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
            const fileName = `posts/${user.id}/${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 10)}.${ext}`;
            const r = await uploadLocalFile(uri, fileName, contentType);
            if (r.publicUrl) uploadedImages.push(r.publicUrl);
          } catch (e) {
            console.warn('Image upload failed:', e);
          }
        }
        uploadedImagesRef.current = uploadedImages;
      }

      // ==========================================================
      // 3. Video file
      // ==========================================================
      let videoUrl: string | null = null;
      if (editResult.type === 'video') {
        let ext = 'mp4';
        let mime = 'video/mp4';
        const l = editResult.uri.toLowerCase();
        if (l.endsWith('.mov')) {
          ext = 'mov';
          mime = 'video/quicktime';
        } else if (l.endsWith('.webm')) {
          ext = 'webm';
          mime = 'video/webm';
        } else if (l.endsWith('.mkv')) {
          ext = 'mkv';
          mime = 'video/x-matroska';
        }

        const vName = `videos/${user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}.${ext}`;
        const vRes = await uploadLocalFile(editResult.uri, vName, mime);
        if (!vRes.publicUrl) {
          throw new Error(vRes.error || 'Video upload failed');
        }
        videoUrl = vRes.publicUrl;
      }

      // ==========================================================
      // 4. Specifications
      // ==========================================================
      const finalPrice = priceType === 'free' ? 0 : parseFloat(price) || 0;

      const specifications: Record<string, any> = {};
      if (priceType !== 'free') {
        specifications.price = finalPrice;
        specifications.price_type = priceType;
      } else {
        specifications.price_type = 'free';
      }

      if (
        editResult.type === 'video' &&
        editResult.trimEnd > 0 &&
        editResult.trimEnd > editResult.trimStart
      ) {
        specifications.trim_start = editResult.trimStart;
        specifications.trim_end = editResult.trimEnd;
      }

      specifications.text_overlays = editResult.textOverlays ?? [];

      if (editResult.filter && editResult.filter !== 'none') {
        specifications.filter = editResult.filter;
      }

      // ==========================================================
      // 5. Insert payload
      // ==========================================================
      const insertData: any = {
        name: title.trim(),
        description: description.trim() || null,
        category: 'Uncategorized',
        images: uploadedImages.length > 0 ? uploadedImages : null,
        price: finalPrice,
        price_type: priceType,
        specifications,
        is_active: true,
        user_id: user.id,
      };

      if (editResult.type === 'video' && videoUrl) {
        insertData.video = videoUrl;
        insertData.video_thumbnail = thumbnailUrl || null;

        const trimmedDuration = Math.max(
          0,
          editResult.trimEnd - editResult.trimStart
        );
        if (trimmedDuration > 0) {
          insertData.video_duration = Math.round(trimmedDuration);
        }

        if (editResult.fileSize) {
          insertData.video_size = editResult.fileSize;
        }
      } else if (uploadedImages.length > 0) {
        insertData.video_thumbnail = uploadedImages[0];
      }

      const { error } = await supabase.from('catalog').insert(insertData);
      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      navigation.popToTop();
    } catch (err: any) {
      console.error('Publish failed:', err);
      showStyledAlert({
        title: 'Upload failed',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    } finally {
      setSaving(false);
    }
  }, [
    user?.id,
    editResult,
    title,
    description,
    price,
    priceType,
    navigation,
    showStyledAlert,
    hideStyledAlert,
  ]);

  const canPost = useMemo(
    () => !!title.trim() && !!editResult && !saving,
    [title, editResult, saving]
  );

  if (!editResult) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#8A8AAE" />
        <Text style={styles.missingText}>
          Missing media. Go back and try again.
        </Text>
        <TouchableOpacity
          style={styles.missingButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.missingButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.topTitle}>New Post</Text>

        <TouchableOpacity
          onPress={handlePost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
          disabled={!canPost}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* MEDIA PREVIEW */}
        <View style={styles.previewBlock}>
          {isVideo ? (
            previewImages.length > 0 ? (
              <>
                <Image
                  source={{ uri: previewImages[0] }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                {activeFilterTint && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: activeFilterTint },
                    ]}
                    pointerEvents="none"
                  />
                )}
              </>
            ) : (
              <View style={styles.previewPlaceholder}>
                <Ionicons name="videocam" size={48} color="#8A8AAE" />
                <Text style={styles.previewPlaceholderText}>
                  Uploading cover…
                </Text>
              </View>
            )
          ) : previewImages.length > 0 ? (
            <>
              <FlatList
                data={previewImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, idx) => `${uri}-${idx}`}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(
                    e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setCarouselIndex(idx);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={[styles.previewImage, { width: SCREEN_WIDTH }]}
                    resizeMode="cover"
                  />
                )}
              />

              {activeFilterTint && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: activeFilterTint },
                  ]}
                  pointerEvents="none"
                />
              )}

              {previewImages.length > 1 && (
                <>
                  <View style={styles.carouselDots} pointerEvents="none">
                    {previewImages.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.carouselDot,
                          idx === carouselIndex && styles.carouselDotActive,
                        ]}
                      />
                    ))}
                  </View>

                  <View style={styles.carouselCounter} pointerEvents="none">
                    <Ionicons name="images" size={12} color="#FFFFFF" />
                    <Text style={styles.carouselCounterText}>
                      {carouselIndex + 1}/{previewImages.length}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="images-outline" size={48} color="#8A8AAE" />
              <Text style={styles.previewPlaceholderText}>
                Uploading images…
              </Text>
            </View>
          )}
        </View>

        {/* TITLE */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Give your post a title"
            placeholderTextColor="#8A8AAE"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
            returnKeyType="next"
          />
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a description (optional)"
            placeholderTextColor="#8A8AAE"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.helperText}>{description.length} / 500</Text>
        </View>

        {/* PRICING */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pricing</Text>
          <View style={styles.priceChipRow}>
            {(
              [
                { key: 'fixed', label: 'Fixed', icon: 'pricetag-outline' },
                {
                  key: 'negotiable',
                  label: 'Negotiable',
                  icon: 'swap-horizontal-outline',
                },
                { key: 'free', label: 'Free', icon: 'gift-outline' },
              ] as const
            ).map((opt) => {
              const selected = priceType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.priceChip,
                    selected && styles.priceChipActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriceType(opt.key);
                    if (opt.key === 'free') setPrice('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={15}
                    color={selected ? '#4A7DFF' : '#8A8AAE'}
                  />
                  <Text
                    style={[
                      styles.priceChipText,
                      selected && styles.priceChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PRICE */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {priceType === 'negotiable'
              ? 'Starting Price (UGX)'
              : 'Price (UGX)'}
          </Text>
          <TextInput
            style={[styles.input, isFree && styles.inputDisabled]}
            placeholder={
              isFree
                ? 'Free — no price needed'
                : priceType === 'negotiable'
                ? 'Enter a starting price'
                : 'Enter your price'
            }
            placeholderTextColor="#8A8AAE"
            keyboardType="numeric"
            editable={!isFree}
            value={isFree ? '' : price}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '');
              setPrice(digits);
            }}
          />
        </View>
      </ScrollView>

      <StyledAlert
        visible={styledAlertConfig.visible}
        title={styledAlertConfig.title}
        message={styledAlertConfig.message}
        icon={styledAlertConfig.icon}
        iconColor={styledAlertConfig.iconColor}
        buttons={styledAlertConfig.buttons}
        onClose={hideStyledAlert}
      />
    </KeyboardAvoidingView>
  );
};

// ============================================================
// STYLES (unchanged from previous)
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  centered: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  missingText: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  missingButton: {
    marginTop: 12,
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  missingButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  postButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: { backgroundColor: 'rgba(74,125,255,0.4)' },
  postButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 16 },
  previewBlock: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: height * 0.5,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000',
  },
  previewPlaceholderText: { color: '#8A8AAE', fontSize: 13 },
  carouselDots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  carouselDotActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  carouselCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  carouselCounterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  section: { marginBottom: 18 },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputDisabled: { opacity: 0.5 },
  helperText: {
    color: '#6A7A9E',
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  priceChipRow: { flexDirection: 'row', gap: 8 },
  priceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  priceChipActive: {
    backgroundColor: 'rgba(74,125,255,0.15)',
    borderColor: '#4A7DFF',
  },
  priceChipText: {
    color: '#8A8AAE',
    fontSize: 12,
    fontWeight: '500',
  },
  priceChipTextActive: {
    color: '#4A7DFF',
    fontWeight: '600',
  },
});