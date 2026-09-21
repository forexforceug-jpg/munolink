// src/features/upload/UploadCameraScreen.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Animated,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StyledAlert } from '../feed/components/StyledAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_VIDEO_SECONDS = 60;

// ============================================================
// TYPES
// ============================================================
type CaptureMode = 'picture' | 'video';
type FlashMode = 'off' | 'on' | 'auto';
type ActiveTool =
  | 'text'
  | 'stickers'
  | 'filters'
  | 'sound'
  | 'trim'
  | 'cover'
  | null;

type PickedAsset = {
  uri: string;
  type: 'image' | 'video';
  duration?: number | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
};

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  backgroundColor: string | null;
  scale: number;
  textAlign?: 'left' | 'center' | 'right';
  imageIndex?: number;
};

type EditAsset = {
  uri: string;
  type: 'image' | 'video';
  duration: number;
  fileSize: number | null;
  extraImages: string[];
};

// ============================================================
// CONSTANTS
// ============================================================
const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF4D6D', '#FF6B6B', '#FFD93D', '#FFA502',
  '#2ECC71', '#00D2D3', '#4A7DFF', '#6C5CE7', '#E056FD', '#FD79A8',
];

// ✅ Text background colors — matches TikTok's highlight options
const TEXT_BG_COLORS: Array<{ key: string; value: string | null; label: string }> = [
  { key: 'none', value: null, label: 'None' },
  { key: 'black', value: 'rgba(0,0,0,0.75)', label: 'Black' },
  { key: 'white', value: 'rgba(255,255,255,0.85)', label: 'White' },
  { key: 'blue', value: 'rgba(74,125,255,0.9)', label: 'Blue' },
  { key: 'red', value: 'rgba(255,77,109,0.9)', label: 'Red' },
  { key: 'yellow', value: 'rgba(255,217,61,0.9)', label: 'Yellow' },
  { key: 'green', value: 'rgba(46,204,113,0.9)', label: 'Green' },
  { key: 'pink', value: 'rgba(253,121,168,0.9)', label: 'Pink' },
  { key: 'purple', value: 'rgba(108,92,231,0.9)', label: 'Purple' },
];

const FONT_OPTIONS: Array<{ key: string; label: string; family: string }> = [
  { key: 'bold', label: 'Bold', family: 'System' },
  { key: 'serif', label: 'Serif', family: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  { key: 'mono', label: 'Mono', family: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  { key: 'condensed', label: 'Condensed', family: Platform.OS === 'ios' ? 'AvenirNextCondensed-Bold' : 'sans-serif-condensed' },
  { key: 'rounded', label: 'Rounded', family: Platform.OS === 'ios' ? 'Arial Rounded MT Bold' : 'sans-serif' },
  { key: 'cursive', label: 'Script', family: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive' },
];

const FONT_SIZE_PRESETS = [
  { key: 'S', size: 18 },
  { key: 'M', size: 28 },
  { key: 'L', size: 42 },
  { key: 'XL', size: 56 },
];

const STICKER_TABS = ['Emoji', 'GIFs', 'Shapes'] as const;

const EMOJI_STICKERS = [
  '😀','😂','🥰','😎','🤩','😭','🔥','✨','💯','👀','🙌','👏',
  '💪','🤝','💖','💔','🎉','🎁','🌟','⚡','💫','🌈','☀️','🌙',
  '🍕','☕','🍦','🎂','🛍️','💰','📸','🎬','🏠','🚗','✈️','📍',
  '✅','❌','⭐','❤️','👍','👎','🙏','💀','👻','🤖','👽','🐱',
];

const SHAPE_STICKERS = [
  '❤️','⭐','🔥','✨','💯','🔴','🟡','🟢','🔵','🟣','⬛','⬜',
];

const FILTER_PRESETS = [
  { key: 'none', label: 'None', overlay: null },
  { key: 'warm', label: 'Warm', overlay: 'rgba(255,150,80,0.18)' },
  { key: 'cool', label: 'Cool', overlay: 'rgba(80,150,255,0.18)' },
  { key: 'vintage', label: 'Vintage', overlay: 'rgba(200,150,80,0.22)' },
  { key: 'mono', label: 'Mono', overlay: 'rgba(120,120,120,0.25)' },
  { key: 'vivid', label: 'Vivid', overlay: 'rgba(255,80,120,0.15)' },
];

const TRASH_ZONE_HEIGHT = 120;

// ============================================================
// DRAGGABLE TEXT OVERLAY
// ============================================================
interface DraggableTextProps {
  overlay: TextOverlay;
  layerW: number;
  layerH: number;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onScale: (scale: number) => void;
  onDragToTrash: () => void;
  onDragStateChange: (dragging: boolean, overTrash: boolean) => void;
}

const DraggableText: React.FC<DraggableTextProps> = ({
  overlay,
  layerW,
  layerH,
  isSelected,
  onSelect,
  onMove,
  onScale,
  onDragToTrash,
  onDragStateChange,
}) => {
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const layerRef = useRef({ w: layerW, h: layerH });
  layerRef.current = { w: layerW, h: layerH };
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const onScaleRef = useRef(onScale);
  onScaleRef.current = onScale;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onDragToTrashRef = useRef(onDragToTrash);
  onDragToTrashRef.current = onDragToTrash;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;

  const gestureStart = useRef({
    posX: 0,
    posY: 0,
    scale: 1,
    pinchDistance: 0,
  });
  const isOverTrashRef = useRef(false);
  const isPinchingRef = useRef(false);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: () => {
          onSelectRef.current();
          onDragStateChangeRef.current(true, false);

          gestureStart.current = {
            posX: overlayRef.current.x * layerRef.current.w,
            posY: overlayRef.current.y * layerRef.current.h,
            scale: overlayRef.current.scale,
            pinchDistance: 0,
          };
          isOverTrashRef.current = false;
          isPinchingRef.current = false;
        },

        onPanResponderMove: (
          evt: GestureResponderEvent,
          g: PanResponderGestureState
        ) => {
          const touches = evt.nativeEvent.touches;

          if (touches.length >= 2) {
            isPinchingRef.current = true;
            const [a, b] = touches;
            const dx = a.pageX - b.pageX;
            const dy = a.pageY - b.pageY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (gestureStart.current.pinchDistance === 0) {
              gestureStart.current.pinchDistance = dist || 1;
              return;
            }

            const factor = dist / gestureStart.current.pinchDistance;
            const next = Math.max(
              0.3,
              Math.min(4, gestureStart.current.scale * factor)
            );
            onScaleRef.current(next);
            return;
          }

          if (isPinchingRef.current) {
            isPinchingRef.current = false;
            gestureStart.current.pinchDistance = 0;
            return;
          }

          const nextX = gestureStart.current.posX + g.dx;
          const nextY = gestureStart.current.posY + g.dy;

          const overTrash = nextY < TRASH_ZONE_HEIGHT;
          if (overTrash !== isOverTrashRef.current) {
            isOverTrashRef.current = overTrash;
            onDragStateChangeRef.current(true, overTrash);
            try {
              Haptics.selectionAsync();
            } catch {}
          }

          const maxX = layerRef.current.w - 20;
          const maxY = layerRef.current.h - 20;
          const clampedX = Math.max(0, Math.min(maxX, nextX));
          const clampedY = Math.max(0, Math.min(maxY, nextY));

          onMoveRef.current(
            clampedX / layerRef.current.w,
            clampedY / layerRef.current.h
          );
        },

        onPanResponderRelease: () => {
          onDragStateChangeRef.current(false, false);
          if (isOverTrashRef.current) {
            onDragToTrashRef.current();
            isOverTrashRef.current = false;
          }
          isPinchingRef.current = false;
          gestureStart.current.pinchDistance = 0;
        },

        onPanResponderTerminate: () => {
          onDragStateChangeRef.current(false, false);
          isOverTrashRef.current = false;
          isPinchingRef.current = false;
          gestureStart.current.pinchDistance = 0;
        },
      }),
    []
  );

  const isDarkText = overlay.color === '#000000';

  return (
    <View
      style={[
        styles.textOverlayWrapper,
        {
          left: overlay.x * layerW,
          top: overlay.y * layerH,
          transform: [{ scale: overlay.scale }],
          backgroundColor: overlay.backgroundColor || 'transparent',
          borderRadius: overlay.backgroundColor ? 8 : 0,
          paddingHorizontal: overlay.backgroundColor ? 8 : 6,
          paddingVertical: 4,
        },
        isSelected && styles.textOverlaySelected,
      ]}
      {...panResponder.panHandlers}
    >
      <Text
        style={[
          styles.textOverlayText,
          {
            color: overlay.color,
            fontSize: overlay.fontSize,
            fontFamily: overlay.fontFamily,
            textAlign: overlay.textAlign || 'center',
            textShadowColor: overlay.backgroundColor
              ? 'transparent'
              : isDarkText
              ? 'rgba(255,255,255,0.7)'
              : 'rgba(0,0,0,0.65)',
            textShadowRadius: overlay.backgroundColor ? 0 : 6,
          },
        ]}
      >
        {overlay.text || ' '}
      </Text>
    </View>
  );
};

// ============================================================
// VIDEO EDIT PREVIEW
// ============================================================
interface VideoEditPreviewProps {
  uri: string;
  onFramePicked: (thumbUri: string) => void;
  trimStart: number;
  trimEnd: number;
  duration: number;
  onDurationLoaded: (d: number) => void;
  onTrimChange: (start: number, end: number) => void;
  showTrimBar: boolean;
}

const VideoEditPreview: React.FC<VideoEditPreviewProps> = ({
  uri,
  onFramePicked,
  trimStart,
  trimEnd,
  duration,
  onDurationLoaded,
  onTrimChange,
  showTrimBar,
}) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [containerW, setContainerW] = useState(SCREEN_WIDTH);

  useEffect(() => {
    if (!player) return;
    const iv = setInterval(() => {
      try {
        const t = player.currentTime ?? 0;
        setCurrentTime(t);
        if (duration > 0 && (t >= trimEnd || t < trimStart)) {
          try {
            player.currentTime = trimStart;
          } catch {}
        }
      } catch {}
    }, 100);
    return () => clearInterval(iv);
  }, [player, trimStart, trimEnd, duration]);

  useEffect(() => {
    if (!player) return;
    const iv = setInterval(() => {
      const d = player.duration ?? 0;
      if (d > 0) {
        onDurationLoaded(d);
        clearInterval(iv);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [player, onDurationLoaded]);

  useEffect(() => {
    if (!player || duration <= 0) return;
    try {
      player.currentTime = trimStart;
      player.play();
    } catch {}
  }, [duration]);

  const pickFrameAt = useCallback(
    async (seconds: number) => {
      try {
        const res = await VideoThumbnails.getThumbnailAsync(uri, {
          time: Math.max(0, Math.floor(seconds * 1000)),
          quality: 0.85,
        });
        if (res?.uri) onFramePicked(res.uri);
      } catch (err) {
        console.warn('Frame pick failed:', err);
      }
    },
    [uri, onFramePicked]
  );

  const pxPerSec = duration > 0 ? containerW / duration : 0;
  const trimStartPx = trimStart * pxPerSec;
  const trimEndPx = trimEnd * pxPerSec;
  const playheadPx = currentTime * pxPerSec;

  const makeHandleResponder = (side: 'left' | 'right') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        try {
          player.pause();
        } catch {}
      },
      onPanResponderMove: (_, g) => {
        if (duration <= 0 || pxPerSec <= 0) return;
        const delta = g.dx / pxPerSec;
        if (side === 'left') {
          const nextStart = Math.max(
            0,
            Math.min(trimEnd - 0.5, trimStart + delta)
          );
          onTrimChange(nextStart, trimEnd);
          try {
            player.currentTime = nextStart;
          } catch {}
        } else {
          const nextEnd = Math.max(
            trimStart + 0.5,
            Math.min(duration, trimEnd + delta)
          );
          onTrimChange(trimStart, nextEnd);
        }
      },
      onPanResponderRelease: () => {
        try {
          player.currentTime = trimStart;
          player.play();
        } catch {}
      },
    });

  const leftHandleResponder = useMemo(
    () => makeHandleResponder('left'),
    [trimStart, trimEnd, duration, pxPerSec]
  );
  const rightHandleResponder = useMemo(
    () => makeHandleResponder('right'),
    [trimStart, trimEnd, duration, pxPerSec]
  );

  const handleTrackTap = useCallback(
    (evt: GestureResponderEvent) => {
      if (duration <= 0) return;
      const x = evt.nativeEvent.locationX;
      const pct = Math.max(0, Math.min(1, x / containerW));
      const clamped = Math.max(trimStart, Math.min(trimEnd, pct * duration));
      setCurrentTime(clamped);
      try {
        player.currentTime = clamped;
      } catch {}
    },
    [duration, containerW, trimStart, trimEnd, player]
  );

  return (
    <View style={styles.editPreviewContainer}>
      <VideoView
        player={player}
        style={styles.editVideo}
        contentFit="contain"
        nativeControls={false}
      />

      <TouchableOpacity
        style={styles.pickCoverBtn}
        onPress={() => pickFrameAt(currentTime)}
      >
        <Ionicons name="image-outline" size={16} color="#FFFFFF" />
        <Text style={styles.pickCoverText}>Set cover</Text>
      </TouchableOpacity>

      {showTrimBar && duration > 0 && (
        <View
          style={styles.trimBarWrapper}
          onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
        >
          <TouchableOpacity
            style={styles.trimTrack}
            activeOpacity={1}
            onPress={handleTrackTap}
          >
            <View
              style={[
                styles.trimDim,
                { left: 0, width: Math.max(0, trimStartPx) },
              ]}
            />
            <View style={[styles.trimDim, { left: trimEndPx, right: 0 }]} />
            <View
              style={[
                styles.trimActive,
                {
                  left: trimStartPx,
                  width: Math.max(0, trimEndPx - trimStartPx),
                },
              ]}
            />
            <View
              style={[styles.trimPlayhead, { left: Math.max(0, playheadPx) }]}
            />
          </TouchableOpacity>
          <View
            style={[styles.trimHandle, { left: Math.max(0, trimStartPx - 8) }]}
            {...leftHandleResponder.panHandlers}
          >
            <View style={styles.trimHandleBar} />
          </View>
          <View
            style={[styles.trimHandle, { left: Math.max(0, trimEndPx - 8) }]}
            {...rightHandleResponder.panHandlers}
          >
            <View style={styles.trimHandleBar} />
          </View>
        </View>
      )}
    </View>
  );
};

// ============================================================
// RIGHT-SIDE TOOL RAIL
// ============================================================
const ToolRail: React.FC<{
  activeTool: ActiveTool;
  onSelect: (t: ActiveTool) => void;
  isVideo: boolean;
}> = ({ activeTool, onSelect, isVideo }) => {
  const tools = [
    { key: 'text' as const, icon: 'text' as const, label: 'Text' },
    { key: 'stickers' as const, icon: 'happy-outline' as const, label: 'Stickers' },
    { key: 'filters' as const, icon: 'color-filter-outline' as const, label: 'Filters' },
    { key: 'sound' as const, icon: 'musical-notes-outline' as const, label: 'Sound' },
    { key: 'trim' as const, icon: 'cut-outline' as const, label: 'Trim', hidden: !isVideo },
    { key: 'cover' as const, icon: 'image-outline' as const, label: 'Cover', hidden: !isVideo },
  ];

  return (
    <View style={styles.toolRail} pointerEvents="box-none">
      {tools
        .filter((t) => !t.hidden)
        .map((t) => {
          const isActive = activeTool === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.toolRailItem, isActive && styles.toolRailItemActive]}
              onPress={() => onSelect(isActive ? null : t.key)}
            >
              <Ionicons name={t.icon} size={22} color={isActive ? '#4A7DFF' : '#FFFFFF'} />
              <Text style={[styles.toolRailLabel, isActive && styles.toolRailLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
};

// ============================================================
// MAIN SCREEN
// ============================================================
export const UploadCameraScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<CaptureMode>('video');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [editAsset, setEditAsset] = useState<EditAsset | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [activeFilter, setActiveFilter] = useState<string>('none');

  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  const [showTextInput, setShowTextInput] = useState(false);
  const [draftText, setDraftText] = useState('');

  const [activeStickerTab, setActiveStickerTab] =
    useState<typeof STICKER_TABS[number]>('Emoji');

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [layerW, setLayerW] = useState(SCREEN_WIDTH);
  const [layerH, setLayerH] = useState(SCREEN_HEIGHT);

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
  }>({ visible: false, title: '', message: '', buttons: [] });

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

  const allImages = useMemo(() => {
    if (!editAsset) return [];
    if (editAsset.type === 'image') {
      return [editAsset.uri, ...editAsset.extraImages];
    }
    return [];
  }, [editAsset]);

  const activeImageUri = allImages[activeImageIndex] || editAsset?.uri || '';

  const visibleOverlays = useMemo(() => {
    if (!editAsset) return [];
    if (editAsset.type === 'video') return textOverlays;
    return textOverlays.filter(
      (o) => o.imageIndex === undefined || o.imageIndex === activeImageIndex
    );
  }, [textOverlays, editAsset, activeImageIndex]);

  const selectedOverlay = useMemo(
    () => textOverlays.find((o) => o.id === selectedOverlayId) || null,
    [textOverlays, selectedOverlayId]
  );

  const trashPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isOverTrash) {
      Animated.sequence([
        Animated.timing(trashPulse, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(trashPulse, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  }, [isOverTrash, trashPulse]);

  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const handleCameraReady = useCallback(() => setCameraReady(true), []);

  const startEditForAsset = useCallback(
    (asset: PickedAsset, extras: string[] = []) => {
      const durationSeconds =
        asset.type === 'video' && asset.duration && asset.duration > 0
          ? asset.duration / 1000
          : 0;

      setEditAsset({
        uri: asset.uri,
        type: asset.type,
        duration: durationSeconds,
        fileSize: asset.fileSize ?? null,
        extraImages: asset.type === 'image' ? extras : [],
      });
      setTrimStart(0);
      setTrimEnd(durationSeconds);
      setTextOverlays([]);
      setSelectedOverlayId(null);
      setVideoThumbnail(null);
      setActiveTool(null);
      setActiveFilter('none');
      setActiveImageIndex(0);
    },
    []
  );

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (!photo?.uri) return;
      startEditForAsset({
        uri: photo.uri,
        type: 'image',
        width: photo.width ?? null,
        height: photo.height ?? null,
      });
    } catch (err: any) {
      showStyledAlert({
        title: 'Capture failed',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, startEditForAsset, showStyledAlert, hideStyledAlert]);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => {
          if (s + 1 >= MAX_VIDEO_SECONDS) {
            cameraRef.current?.stopRecording();
            return MAX_VIDEO_SECONDS;
          }
          return s + 1;
        });
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_SECONDS,
      });

      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);

      if (!video?.uri) return;
      startEditForAsset({
        uri: video.uri,
        type: 'video',
        duration: recordSeconds * 1000,
      });
    } catch (err: any) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsRecording(false);
      setIsPaused(false);
      showStyledAlert({
        title: 'Recording failed',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [isRecording, recordSeconds, startEditForAsset, showStyledAlert, hideStyledAlert]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cameraRef.current?.stopRecording();
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (!isRecording || isPaused) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      (cameraRef.current as any)?.pauseRecording?.();
    } catch {}
    setIsPaused(true);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (!isRecording || !isPaused) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      (cameraRef.current as any)?.resumeRecording?.();
    } catch {}
    setIsPaused(false);
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => {
        if (s + 1 >= MAX_VIDEO_SECONDS) {
          cameraRef.current?.stopRecording();
          return MAX_VIDEO_SECONDS;
        }
        return s + 1;
      });
    }, 1000);
  }, [isRecording, isPaused]);

  const handleShutterPress = useCallback(() => {
    if (mode === 'picture') takePhoto();
    else {
      if (isRecording) stopRecording();
      else startRecording();
    }
  }, [mode, isRecording, takePhoto, startRecording, stopRecording]);

  const handleGalleryPress = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.9,
        videoMaxDuration: MAX_VIDEO_SECONDS,
      });

      if (result.canceled || !result.assets?.length) return;

      const firstVideo = result.assets.find((a) => a.type === 'video');
      const primary = firstVideo ?? result.assets[0];

      const extras =
        primary.type !== 'video'
          ? result.assets
              .filter((a) => a.type !== 'video')
              .filter((a) => a.uri !== primary.uri)
              .map((a) => a.uri)
          : [];

      startEditForAsset(
        {
          uri: primary.uri,
          type: primary.type === 'video' ? 'video' : 'image',
          duration: primary.duration ?? null,
          fileSize: primary.fileSize ?? null,
          width: primary.width ?? null,
          height: primary.height ?? null,
        },
        extras
      );
    } catch (err: any) {
      showStyledAlert({
        title: 'Upload failed',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [startEditForAsset, showStyledAlert, hideStyledAlert]);

  const handleAddMoreImages = useCallback(async () => {
    if (!editAsset || editAsset.type !== 'image') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - (1 + editAsset.extraImages.length),
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;

      const newUris = result.assets.map((a) => a.uri);
      setEditAsset((prev) =>
        prev ? { ...prev, extraImages: [...prev.extraImages, ...newUris] } : prev
      );

      setActiveImageIndex(1 + editAsset.extraImages.length);
      setSelectedOverlayId(null);
    } catch (err: any) {
      showStyledAlert({
        title: 'Could not add images',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [editAsset, showStyledAlert, hideStyledAlert]);

  const handleRemoveImage = useCallback(
    (index: number) => {
      if (!editAsset) return;
      if (editAsset.type !== 'image') return;
      const total = 1 + editAsset.extraImages.length;
      if (total <= 1) return;

      showStyledAlert({
        title: 'Remove image?',
        message: 'This image will be removed from the post.',
        icon: 'trash-outline',
        iconColor: '#E74C3C',
        buttons: [
          { text: 'Cancel', style: 'cancel', onPress: hideStyledAlert },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              hideStyledAlert();
              setEditAsset((prev) => {
                if (!prev) return prev;
                const extras = [...prev.extraImages];
                if (index === 0) {
                  const newPrimary = extras.shift()!;
                  return { ...prev, uri: newPrimary, extraImages: extras };
                }
                extras.splice(index - 1, 1);
                return { ...prev, extraImages: extras };
              });
              setActiveImageIndex((idx) => Math.max(0, idx - 1));
              setSelectedOverlayId(null);
            },
          },
        ],
      });
    },
    [editAsset, showStyledAlert, hideStyledAlert]
  );

  const cycleFlash = useCallback(() => {
    setFlash((prev: FlashMode): FlashMode => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const addTextOverlay = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) {
        setShowTextInput(false);
        setDraftText('');
        return;
      }
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isImagePost = editAsset?.type === 'image';
      setTextOverlays((prev) => [
        ...prev,
        {
          id,
          text: trimmed.slice(0, 60),
          x: 0.15,
          y: 0.4,
          color: '#FFFFFF',
          fontSize: 28,
          fontFamily: 'System',
          backgroundColor: null,
          scale: 1,
          textAlign: 'center',
          imageIndex: isImagePost ? activeImageIndex : undefined,
        },
      ]);
      setSelectedOverlayId(id);
      setDraftText('');
      setShowTextInput(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [editAsset, activeImageIndex]
  );

  const addStickerOverlay = useCallback(
    (emoji: string) => {
      const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const isImagePost = editAsset?.type === 'image';
      setTextOverlays((prev) => [
        ...prev,
        {
          id,
          text: emoji,
          x: 0.4,
          y: 0.4,
          color: '#FFFFFF',
          fontSize: 56,
          fontFamily: 'System',
          backgroundColor: null,
          scale: 1,
          textAlign: 'center',
          imageIndex: isImagePost ? activeImageIndex : undefined,
        },
      ]);
      setSelectedOverlayId(id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [editAsset, activeImageIndex]
  );

  const updateSelectedOverlay = useCallback(
    (patch: Partial<TextOverlay>) => {
      if (!selectedOverlayId) return;
      setTextOverlays((prev) =>
        prev.map((o) => (o.id === selectedOverlayId ? { ...o, ...patch } : o))
      );
    },
    [selectedOverlayId]
  );

  const deleteSelectedOverlay = useCallback(() => {
    if (!selectedOverlayId) return;
    setTextOverlays((prev) => prev.filter((o) => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedOverlayId]);

  // ✅ Tapping the preview closes any open tool sheet (Text / Stickers / etc.)
  const handlePreviewTap = useCallback(() => {
    if (activeTool) {
      Haptics.selectionAsync();
      setActiveTool(null);
    }
    // Tapping preview also deselects any active text overlay
    if (selectedOverlayId) {
      setSelectedOverlayId(null);
    }
  }, [activeTool, selectedOverlayId]);

  const discardEdit = useCallback(() => {
    showStyledAlert({
      title: 'Discard changes?',
      message: 'Your captured media will be lost.',
      icon: 'trash-outline',
      iconColor: '#E74C3C',
      buttons: [
        { text: 'Keep editing', style: 'cancel', onPress: hideStyledAlert },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            hideStyledAlert();
            setEditAsset(null);
            setTextOverlays([]);
            setSelectedOverlayId(null);
            setVideoThumbnail(null);
            setTrimStart(0);
            setTrimEnd(0);
            setActiveTool(null);
            setActiveFilter('none');
            setActiveImageIndex(0);
          },
        },
      ],
    });
  }, [showStyledAlert, hideStyledAlert]);

  const goToPostDetails = useCallback(() => {
    if (!editAsset) return;
    if (editAsset.type === 'video' && trimEnd - trimStart < 1) {
      showStyledAlert({
        title: 'Clip too short',
        message: 'Keep at least 1 second of video.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const allImgs =
      editAsset.type === 'image'
        ? [editAsset.uri, ...editAsset.extraImages]
        : [];

    navigation.navigate('UploadEditor', {
      editResult: {
        uri: editAsset.uri,
        type: editAsset.type,
        trimStart: editAsset.type === 'video' ? trimStart : 0,
        trimEnd: editAsset.type === 'video' ? trimEnd : 0,
        videoThumbnail: videoThumbnail ?? null,
        fileSize: editAsset.fileSize,
        textOverlays,
        extraImages: allImgs.slice(1),
        filter: activeFilter,
      },
    });
  }, [
    editAsset,
    trimStart,
    trimEnd,
    videoThumbnail,
    textOverlays,
    activeFilter,
    navigation,
    showStyledAlert,
    hideStyledAlert,
  ]);

  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  if (!cameraPermission.granted && !editAsset) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color="#8A8AAE" />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permText}>
          Munolink uses your camera so you can post directly from the app.
        </Text>
        <TouchableOpacity
          style={styles.permButton}
          onPress={requestCameraPermission}
        >
          <Text style={styles.permButtonText}>Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.permSecondary}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permSecondaryText}>Not now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // EDIT MODE
  // ============================================================
  if (editAsset) {
    const isVideo = editAsset.type === 'video';
    const activeFilterObj = FILTER_PRESETS.find((f) => f.key === activeFilter);
    const totalImages = allImages.length;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" translucent />

        {/*
          ✅ FULL-SCREEN PREVIEW + OVERLAY LAYER
          Tapping empty space here closes the open tool sheet and
          deselects any active overlay. DraggableText overlays sit
          on top and claim their own touches, so tapping them still
          selects/drags them.
        */}
        <Pressable
          style={styles.editPreviewWrapper}
          onPress={handlePreviewTap}
          onLayout={(e) => {
            setLayerW(e.nativeEvent.layout.width);
            setLayerH(e.nativeEvent.layout.height);
          }}
        >
          {isVideo ? (
            <VideoEditPreview
              uri={editAsset.uri}
              onFramePicked={(uri) => setVideoThumbnail(uri)}
              trimStart={trimStart}
              trimEnd={trimEnd || editAsset.duration}
              duration={editAsset.duration}
              showTrimBar={activeTool === 'trim'}
              onDurationLoaded={(d) => {
                setEditAsset((prev) => (prev ? { ...prev, duration: d } : prev));
                if (trimEnd === 0) {
                  setTrimStart(0);
                  setTrimEnd(d);
                }
              }}
              onTrimChange={(s, e) => {
                setTrimStart(s);
                setTrimEnd(e);
              }}
            />
          ) : (
            <Image
              source={{ uri: activeImageUri }}
              style={styles.editImage}
              resizeMode="contain"
            />
          )}

          {activeFilterObj?.overlay && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: activeFilterObj.overlay },
              ]}
              pointerEvents="none"
            />
          )}

          {visibleOverlays.map((overlay) => (
            <DraggableText
              key={overlay.id}
              overlay={overlay}
              layerW={layerW}
              layerH={layerH}
              isSelected={overlay.id === selectedOverlayId}
              onSelect={() => setSelectedOverlayId(overlay.id)}
              onMove={(x, y) =>
                setTextOverlays((prev) =>
                  prev.map((o) => (o.id === overlay.id ? { ...o, x, y } : o))
                )
              }
              onScale={(scale) =>
                setTextOverlays((prev) =>
                  prev.map((o) => (o.id === overlay.id ? { ...o, scale } : o))
                )
              }
              onDragToTrash={() => {
                setTextOverlays((prev) => prev.filter((o) => o.id !== overlay.id));
                if (selectedOverlayId === overlay.id) setSelectedOverlayId(null);
              }}
              onDragStateChange={(dragging, overTrash) => {
                setIsDraggingOverlay(dragging);
                setIsOverTrash(overTrash);
              }}
            />
          ))}
        </Pressable>

        {!isVideo && (
          <View
            style={[styles.thumbnailStripWrap, { bottom: insets.bottom + 16 }]}
            pointerEvents="box-none"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStripContent}
            >
              {allImages.map((uri, idx) => (
                <TouchableOpacity
                  key={`${uri}-${idx}`}
                  style={[
                    styles.thumbnailItem,
                    idx === activeImageIndex && styles.thumbnailItemActive,
                  ]}
                  onPress={() => {
                    setActiveImageIndex(idx);
                    setSelectedOverlayId(null);
                  }}
                  onLongPress={() => handleRemoveImage(idx)}
                  delayLongPress={400}
                >
                  <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
                  <View style={styles.thumbnailBadge}>
                    <Text style={styles.thumbnailBadgeText}>{idx + 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {totalImages < 10 && (
                <TouchableOpacity style={styles.thumbnailAdd} onPress={handleAddMoreImages}>
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {isDraggingOverlay && (
          <View style={[styles.trashZone, { paddingTop: insets.top + 8 }]} pointerEvents="none">
            <Animated.View
              style={[
                styles.trashZoneInner,
                isOverTrash && styles.trashZoneInnerActive,
                {
                  transform: [
                    {
                      scale: trashPulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="trash" size={22} color="#FFFFFF" />
              <Text style={styles.trashZoneText}>Drag here to delete</Text>
            </Animated.View>
          </View>
        )}

        <View style={[styles.editTopBar, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={discardEdit}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.editTitleRow}>
            <Text style={styles.editTitle}>Edit</Text>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={goToPostDetails}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.toolRailWrapper,
            { top: insets.top + 80, bottom: insets.bottom + 100 },
          ]}
          pointerEvents="box-none"
        >
          <ToolRail
            activeTool={activeTool}
            onSelect={(t) => {
              Haptics.selectionAsync();
              setActiveTool(t);
            }}
            isVideo={isVideo}
          />
        </View>

        {activeTool && (
          <View style={[styles.toolSheet, { paddingBottom: insets.bottom + 12 }]}>
            {activeTool === 'text' && (
              <>
                <View style={styles.toolSheetHeader}>
                  <Text style={styles.toolSheetTitle}>Text</Text>
                  <TouchableOpacity
                    style={styles.toolSheetAddBtn}
                    onPress={() => setShowTextInput(true)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.toolSheetAddText}>Add text</Text>
                  </TouchableOpacity>
                </View>

                {selectedOverlay && (
                  <>
                    <Text style={styles.optionLabel}>Font</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.toolSheetScroll}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <TouchableOpacity
                          key={`font-${f.key}`}
                          style={[
                            styles.fontChip,
                            selectedOverlay.fontFamily === f.family && styles.fontChipActive,
                          ]}
                          onPress={() => updateSelectedOverlay({ fontFamily: f.family })}
                        >
                          <Text
                            style={[
                              styles.fontChipText,
                              { fontFamily: f.family },
                              selectedOverlay.fontFamily === f.family && styles.fontChipTextActive,
                            ]}
                          >
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Text color */}
                    <Text style={[styles.optionLabel, { marginTop: 10 }]}>Color</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.toolSheetScroll}
                    >
                      {TEXT_COLORS.map((c) => (
                        <TouchableOpacity
                          key={`color-${c}`}
                          style={[
                            styles.colorDot,
                            { backgroundColor: c },
                            selectedOverlay.color === c && styles.colorDotSelected,
                          ]}
                          onPress={() => updateSelectedOverlay({ color: c })}
                        />
                      ))}
                    </ScrollView>

                    {/* ✅ Text background color — new row */}
                    <Text style={[styles.optionLabel, { marginTop: 10 }]}>
                      Background
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.toolSheetScroll}
                    >
                      {TEXT_BG_COLORS.map((bg) => {
                        const isSelected =
                          (selectedOverlay.backgroundColor ?? null) === bg.value;
                        return (
                          <TouchableOpacity
                            key={`bg-${bg.key}`}
                            style={[
                              styles.bgColorDot,
                              bg.value === null && styles.bgColorDotNone,
                              bg.value !== null && { backgroundColor: bg.value },
                              isSelected && styles.colorDotSelected,
                            ]}
                            onPress={() =>
                              updateSelectedOverlay({ backgroundColor: bg.value })
                            }
                          >
                            {bg.value === null && (
                              <Ionicons
                                name="close"
                                size={14}
                                color="#FFFFFF"
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    <View style={styles.inlineRow}>
                      <View style={styles.inlineGroup}>
                        {FONT_SIZE_PRESETS.map((preset) => (
                          <TouchableOpacity
                            key={`size-${preset.key}`}
                            style={[
                              styles.sizeChip,
                              selectedOverlay.fontSize === preset.size && styles.sizeChipActive,
                            ]}
                            onPress={() => updateSelectedOverlay({ fontSize: preset.size })}
                          >
                            <Text
                              style={[
                                styles.sizeChipText,
                                selectedOverlay.fontSize === preset.size && styles.sizeChipTextActive,
                              ]}
                            >
                              {preset.key}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.inlineGroup}>
                        <TouchableOpacity
                          style={[
                            styles.alignBtn,
                            selectedOverlay.textAlign === 'left' && styles.alignBtnActive,
                          ]}
                          onPress={() => updateSelectedOverlay({ textAlign: 'left' })}
                        >
                          <Ionicons
                            name="text-outline"
                            size={16}
                            color={selectedOverlay.textAlign === 'left' ? '#4A7DFF' : '#FFFFFF'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.alignBtn,
                            (!selectedOverlay.textAlign || selectedOverlay.textAlign === 'center') &&
                              styles.alignBtnActive,
                          ]}
                          onPress={() => updateSelectedOverlay({ textAlign: 'center' })}
                        >
                          <Ionicons
                            name="reorder-two-outline"
                            size={16}
                            color={selectedOverlay.textAlign === 'center' ? '#4A7DFF' : '#FFFFFF'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.alignBtn,
                            selectedOverlay.textAlign === 'right' && styles.alignBtnActive,
                          ]}
                          onPress={() => updateSelectedOverlay({ textAlign: 'right' })}
                        >
                          <Ionicons
                            name="text"
                            size={16}
                            color={selectedOverlay.textAlign === 'right' ? '#4A7DFF' : '#FFFFFF'}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteTextBtn}
                      onPress={deleteSelectedOverlay}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={16} color="#FF4D6D" />
                      <Text style={styles.deleteTextBtnText}>Delete text</Text>
                    </TouchableOpacity>
                  </>
                )}

                {!selectedOverlay && (
                  <Text style={styles.toolSheetHint}>
                    Tap "Add text" to add your first overlay.
                  </Text>
                )}
              </>
            )}

            {activeTool === 'stickers' && (
              <>
                <View style={styles.toolSheetHeader}>
                  <Text style={styles.toolSheetTitle}>Stickers</Text>
                </View>
                <View style={styles.stickerTabs}>
                  {STICKER_TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.stickerTab, activeStickerTab === tab && styles.stickerTabActive]}
                      onPress={() => setActiveStickerTab(tab)}
                    >
                      <Text
                        style={[
                          styles.stickerTabText,
                          activeStickerTab === tab && styles.stickerTabTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stickerGrid}>
                  {(activeStickerTab === 'Emoji' ? EMOJI_STICKERS : SHAPE_STICKERS).map((emoji, idx) => (
                    <TouchableOpacity
                      key={`${emoji}-${idx}`}
                      style={styles.stickerCell}
                      onPress={() => addStickerOverlay(emoji)}
                    >
                      <Text style={styles.stickerEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  {activeStickerTab === 'GIFs' && (
                    <View style={styles.emptyTab}>
                      <Text style={styles.emptyTabText}>GIF stickers coming soon</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}

            {activeTool === 'filters' && (
              <>
                <View style={styles.toolSheetHeader}>
                  <Text style={styles.toolSheetTitle}>Filters</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.toolSheetScroll}
                >
                  {FILTER_PRESETS.map((f) => (
                    <TouchableOpacity
                      key={f.key}
                      style={styles.filterChip}
                      onPress={() => setActiveFilter(f.key)}
                    >
                      <View
                        style={[
                          styles.filterSwatch,
                          { backgroundColor: f.overlay ?? 'rgba(255,255,255,0.1)' },
                          activeFilter === f.key && styles.filterSwatchActive,
                        ]}
                      >
                        {f.overlay === null && <Ionicons name="close" size={14} color="#FFFFFF" />}
                      </View>
                      <Text
                        style={[
                          styles.filterChipText,
                          activeFilter === f.key && styles.filterChipTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {activeTool === 'sound' && (
              <View style={styles.toolSheetHeader}>
                <Text style={styles.toolSheetTitle}>Sound</Text>
                <Text style={styles.toolSheetHint}>Sound library coming soon.</Text>
              </View>
            )}

            {activeTool === 'trim' && isVideo && (
              <View style={styles.toolSheetHeader}>
                <Text style={styles.toolSheetTitle}>Trim</Text>
                <Text style={styles.toolSheetHint}>
                  Drag the white handles on the timeline to trim your clip.
                </Text>
              </View>
            )}

            {activeTool === 'cover' && isVideo && (
              <View style={styles.toolSheetHeader}>
                <Text style={styles.toolSheetTitle}>Cover</Text>
                <Text style={styles.toolSheetHint}>
                  Scrub the video, then tap "Set cover" to pick a frame.
                </Text>
              </View>
            )}
          </View>
        )}

        {showTextInput && (
          <Pressable
            style={styles.textInputOverlay}
            onPress={() => {
              setShowTextInput(false);
              setDraftText('');
            }}
          >
            <Pressable
              style={styles.textInputWrapperTransparent}
              onPress={(e) => e.stopPropagation?.()}
            >
              <TextInput
                style={styles.textInputFieldTransparent}
                placeholder="Add text..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={draftText}
                onChangeText={setDraftText}
                autoFocus
                maxLength={60}
                multiline
                textAlign="center"
                returnKeyType="done"
                onSubmitEditing={() => addTextOverlay(draftText)}
                blurOnSubmit={false}
              />
              <View style={styles.textInputActionsTransparent}>
                <TouchableOpacity
                  style={styles.textInputCancelTransparent}
                  onPress={() => {
                    setShowTextInput(false);
                    setDraftText('');
                  }}
                >
                  <Text style={styles.textInputCancelTextTransparent}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.textInputAddTransparent,
                    !draftText.trim() && styles.textInputAddDisabled,
                  ]}
                  disabled={!draftText.trim()}
                  onPress={() => addTextOverlay(draftText)}
                >
                  <Text style={styles.textInputAddTextTransparent}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        )}

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
  }

  // ============================================================
  // CAMERA MODE
  // ============================================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={mode === 'picture' ? flash : 'off'}
          mode={mode}
          videoQuality="1080p"
          onCameraReady={handleCameraReady}
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.modeRow}>
          <TouchableOpacity onPress={() => setMode('video')}>
            <Text style={[styles.modeText, mode === 'video' && styles.modeTextActive]}>VIDEO</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('picture')}>
            <Text style={[styles.modeText, mode === 'picture' && styles.modeTextActive]}>PHOTO</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={cycleFlash}
          disabled={mode === 'video'}
        >
          <Ionicons
            name={
              flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off'
            }
            size={22}
            color={mode === 'video' ? '#666' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </LinearGradient>

      {isRecording && (
        <View style={[styles.recordingBadge, { top: insets.top + 70 }]}>
          <View style={[styles.recordingDot, isPaused && styles.recordingDotPaused]} />
          <Text style={styles.recordingText}>
            {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:
            {String(recordSeconds % 60).padStart(2, '0')}
            {isPaused ? '  (paused)' : ''}
          </Text>
        </View>
      )}

      {isRecording && (
        <View style={[styles.recordProgressTrack, { top: insets.top + 100 }]}>
          <View
            style={[
              styles.recordProgressFill,
              {
                width: `${Math.min(100, (recordSeconds / MAX_VIDEO_SECONDS) * 100)}%`,
              },
            ]}
          />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)']}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}
      >
        <TouchableOpacity style={styles.uploadButton} onPress={handleGalleryPress}>
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="images-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.uploadLabel}>Upload</Text>
        </TouchableOpacity>

        <View style={styles.shutterArea}>
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleShutterPress}
            disabled={isCapturing || !cameraReady}
          >
            <View
              style={[
                styles.shutterInner,
                mode === 'video' && styles.shutterInnerVideo,
                isRecording && styles.shutterInnerRecording,
              ]}
            />
          </TouchableOpacity>
          {isRecording && mode === 'video' && (
            <TouchableOpacity
              style={[styles.pauseButton, { left: SCREEN_WIDTH / 2 - 120 }]}
              onPress={isPaused ? resumeRecording : pauseRecording}
            >
              <Ionicons name={isPaused ? 'play' : 'pause'} size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFacing((prev: CameraType): CameraType => (prev === 'back' ? 'front' : 'back'));
          }}
        >
          <Ionicons name="camera-reverse-outline" size={26} color="#FFFFFF" />
          <Text style={styles.flipLabel}>Flip</Text>
        </TouchableOpacity>
      </LinearGradient>

      {isCapturing && (
        <View style={styles.captureOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      <StyledAlert
        visible={styledAlertConfig.visible}
        title={styledAlertConfig.title}
        message={styledAlertConfig.message}
        icon={styledAlertConfig.icon}
        iconColor={styledAlertConfig.iconColor}
        buttons={styledAlertConfig.buttons}
        onClose={hideStyledAlert}
      />
    </View>
  );
};

const SHUTTER_SIZE = 84;

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16 },
  permText: {
    color: '#8A8AAE',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  permButton: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  permSecondary: { marginTop: 12, padding: 8 },
  permSecondaryText: { color: '#8A8AAE', fontSize: 13 },

  // Camera
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 20,
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modeRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  modeText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  modeTextActive: { color: '#FFFFFF' },
  recordingBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
    zIndex: 25,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
  },
  recordingDotPaused: { backgroundColor: '#F1C40F' },
  recordingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  recordProgressTrack: {
    position: 'absolute',
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
    zIndex: 25,
    overflow: 'hidden',
  },
  recordProgressFill: { height: '100%', backgroundColor: '#E74C3C' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 40,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  uploadButton: { width: 60, alignItems: 'center', gap: 6 },
  uploadPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  uploadLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  shutterArea: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  shutterOuter: {
    width: SHUTTER_SIZE,
    height: SHUTTER_SIZE,
    borderRadius: SHUTTER_SIZE / 2,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: SHUTTER_SIZE - 16,
    height: SHUTTER_SIZE - 16,
    borderRadius: (SHUTTER_SIZE - 16) / 2,
    backgroundColor: '#FFFFFF',
  },
  shutterInnerVideo: { backgroundColor: '#E74C3C' },
  shutterInnerRecording: {
    width: SHUTTER_SIZE - 32,
    height: SHUTTER_SIZE - 32,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
  },
  pauseButton: {
    position: 'absolute',
    top: SHUTTER_SIZE / 2 - 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: { width: 60, alignItems: 'center', gap: 6 },
  flipLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  captureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },

  // Edit
  editPreviewWrapper: { flex: 1, backgroundColor: '#000', position: 'relative' },
  editPreviewContainer: { flex: 1, backgroundColor: '#000', position: 'relative' },
  editVideo: { flex: 1 },
  editImage: { flex: 1, width: '100%' },
  editTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  editTitleRow: { flex: 1, alignItems: 'center' },
  editTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Rail
  toolRailWrapper: {
    position: 'absolute',
    right: 8,
    justifyContent: 'center',
    zIndex: 30,
  },
  toolRail: { alignItems: 'center', gap: 14 },
  toolRailItem: {
    width: 60,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  toolRailItemActive: { backgroundColor: 'rgba(74,125,255,0.18)' },
  toolRailLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.85,
  },
  toolRailLabelActive: { color: '#4A7DFF', opacity: 1 },

  // Bottom sheet
  toolSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,15,26,0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 14,
    paddingHorizontal: 16,
    minHeight: 140,
    maxHeight: SCREEN_HEIGHT * 0.5,
    zIndex: 40,
  },
  toolSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toolSheetTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  toolSheetAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toolSheetAddText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  toolSheetHint: { color: '#8A8AAE', fontSize: 12, lineHeight: 16, marginTop: 4 },
  toolSheetScroll: { alignItems: 'center', gap: 10, paddingVertical: 4, paddingRight: 16 },
  optionLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  // ✅ Background color swatch — same size as text color dot but
  //    has a distinct "none" state with an X icon.
  bgColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgColorDotNone: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  colorDotSelected: { borderColor: '#4A7DFF', borderWidth: 3 },
  sizeChip: {
    width: 38,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sizeChipActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  sizeChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sizeChipTextActive: { color: '#4A7DFF' },
  fontChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  fontChipActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  fontChipText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  fontChipTextActive: { color: '#4A7DFF' },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inlineGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alignBtn: {
    width: 36,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  alignBtnActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  deleteTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,77,109,0.12)',
  },
  deleteTextBtnText: { color: '#FF4D6D', fontSize: 13, fontWeight: '600' },

  // Stickers
  stickerTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  stickerTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  stickerTabActive: { backgroundColor: 'rgba(74,125,255,0.25)' },
  stickerTabText: { color: '#8A8AAE', fontSize: 12, fontWeight: '600' },
  stickerTabTextActive: { color: '#4A7DFF' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 8 },
  stickerCell: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerEmoji: { fontSize: 28 },
  emptyTab: { width: '100%', paddingVertical: 30, alignItems: 'center' },
  emptyTabText: { color: '#8A8AAE', fontSize: 12 },

  // Filters
  filterChip: { alignItems: 'center', gap: 6, padding: 4 },
  filterSwatch: {
    width: 56,
    height: 56,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  filterSwatchActive: { borderColor: '#4A7DFF', borderWidth: 3 },
  filterChipText: { color: '#8A8AAE', fontSize: 11, fontWeight: '600' },
  filterChipTextActive: { color: '#4A7DFF' },

  // Bottom thumbnail strip
  thumbnailStripWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 25,
  },
  thumbnailStripContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  thumbnailItem: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    position: 'relative',
  },
  thumbnailItemActive: { borderColor: '#4A7DFF', borderWidth: 3 },
  thumbnailImage: { width: '100%', height: '100%' },
  thumbnailBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  thumbnailAdd: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Text overlay
  textOverlayWrapper: { position: 'absolute' },
  textOverlayText: {
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 2 },
  },
  textOverlaySelected: {
    borderWidth: 1.5,
    borderColor: '#4A7DFF',
    borderStyle: 'dashed',
    borderRadius: 8,
  },

  // Trash zone
  trashZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TRASH_ZONE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    zIndex: 200,
  },
  trashZoneInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(231,76,60,0.5)',
    backgroundColor: 'rgba(231,76,60,0.15)',
  },
  trashZoneInnerActive: {
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231,76,60,0.45)',
  },
  trashZoneText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Text input overlay
  textInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 300,
  },
  textInputWrapperTransparent: {
    width: '100%',
    maxWidth: 400,
    gap: 8,
  },
  textInputFieldTransparent: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    minHeight: 80,
    textAlignVertical: 'center',
    paddingVertical: 8,
  },
  textInputActionsTransparent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textInputCancelTransparent: { paddingHorizontal: 12, paddingVertical: 10 },
  textInputCancelTextTransparent: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  textInputAddTransparent: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  textInputAddDisabled: { opacity: 0.4 },
  textInputAddTextTransparent: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Trim
  trimBarWrapper: { position: 'absolute', left: 12, right: 12, bottom: 16, height: 40 },
  trimTrack: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  trimDim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  trimActive: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(74,125,255,0.25)',
  },
  trimPlayhead: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  trimHandle: {
    position: 'absolute',
    top: 4,
    width: 16,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trimHandleBar: {
    width: 6,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  pickCoverBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  pickCoverText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});