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
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StyledAlert } from '../feed/components/StyledAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================
type FlashMode = 'off' | 'on' | 'auto';
type ActiveTool =
  | 'text'
  | 'stickers'
  | 'filters'
  | 'sound'
  | null;

type TextAlign = 'left' | 'center' | 'right';

type TextOverlay = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecorationLine: 'none' | 'underline';
  backgroundColor: string | null;
  opacity: number;
  letterSpacing: number;
  lineHeight: number;
  shadow: boolean;
  scale: number;
  rotation: number;
  textAlign: TextAlign;
  imageIndex: number;
};

type EditAsset = {
  images: string[];
  activeIndex: number;
  filter: string;
};

// ============================================================
// CONSTANTS
// ============================================================
const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#FF4D6D', '#FF6B6B', '#FFD93D', '#FFA502',
  '#2ECC71', '#00D2D3', '#4A7DFF', '#6C5CE7', '#E056FD', '#FD79A8',
  '#E17055', '#00B894', '#0984E3', '#6C5CE7', '#B2BEC3', '#636E72',
];

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
  { key: 'orange', value: 'rgba(255,159,67,0.9)', label: 'Orange' },
];

const FONT_OPTIONS: Array<{ key: string; label: string; family: string }> = [
  { key: 'system', label: 'Classic', family: 'System' },
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
  { key: 'XXL', size: 72 },
];

const STICKER_TABS = ['Emoji', 'Shapes'] as const;

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
  { key: 'sepia', label: 'Sepia', overlay: 'rgba(180,140,90,0.28)' },
  { key: 'fade', label: 'Fade', overlay: 'rgba(255,255,255,0.22)' },
];

const TRASH_ZONE_HEIGHT = 120;

// ============================================================
// DEFAULT OVERLAY FACTORY
// ============================================================
const makeDefaultOverlay = (
  text: string,
  imageIndex: number
): TextOverlay => ({
  id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  text: text.slice(0, 80),
  x: 0.15,
  y: 0.4,
  color: '#FFFFFF',
  fontSize: 28,
  fontFamily: 'System',
  fontWeight: 'bold',
  fontStyle: 'normal',
  textDecorationLine: 'none',
  backgroundColor: null,
  opacity: 1,
  letterSpacing: 0,
  lineHeight: 1.2,
  shadow: true,
  scale: 1,
  rotation: 0,
  textAlign: 'center',
  imageIndex,
});

// ============================================================
// DRAGGABLE TEXT OVERLAY
// ============================================================
interface DraggableTextProps {
  overlay: TextOverlay;
  layerW: number;
  layerH: number;
  isSelected: boolean;
  isEditable: boolean;
  onSelect: () => void;
  onDoubleTap: () => void;
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
  isEditable,
  onSelect,
  onDoubleTap,
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
  const onDoubleTapRef = useRef(onDoubleTap);
  onDoubleTapRef.current = onDoubleTap;
  const onDragToTrashRef = useRef(onDragToTrash);
  onDragToTrashRef.current = onDragToTrash;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;
  const isEditableRef = useRef(isEditable);
  isEditableRef.current = isEditable;

  const gestureStart = useRef({
    posX: 0,
    posY: 0,
    scale: 1,
    pinchDistance: 0,
  });
  const isOverTrashRef = useRef(false);
  const isPinchingRef = useRef(false);
  const lastTapRef = useRef(0);
  const hasMovedRef = useRef(false);

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
          hasMovedRef.current = false;
        },

        onPanResponderMove: (
          evt: GestureResponderEvent,
          g: PanResponderGestureState
        ) => {
          if (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3) {
            hasMovedRef.current = true;
          }

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
            isPinchingRef.current = false;
            gestureStart.current.pinchDistance = 0;
            return;
          }

          // Double-tap detection to edit text
          if (!hasMovedRef.current && !isPinchingRef.current) {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
              if (isEditableRef.current) {
                onDoubleTapRef.current();
              }
              lastTapRef.current = 0;
            } else {
              lastTapRef.current = now;
            }
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
  const showShadow = overlay.shadow && !overlay.backgroundColor;

  return (
    <View
      style={[
        styles.textOverlayWrapper,
        {
          left: overlay.x * layerW,
          top: overlay.y * layerH,
          transform: [{ scale: overlay.scale }, { rotate: `${overlay.rotation}deg` }],
          backgroundColor: overlay.backgroundColor || 'transparent',
          borderRadius: overlay.backgroundColor ? 8 : 0,
          paddingHorizontal: overlay.backgroundColor ? 8 : 6,
          paddingVertical: 4,
          opacity: overlay.opacity,
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
            fontWeight: overlay.fontWeight,
            fontStyle: overlay.fontStyle,
            textDecorationLine: overlay.textDecorationLine,
            letterSpacing: overlay.letterSpacing,
            lineHeight: overlay.fontSize * overlay.lineHeight,
            textAlign: overlay.textAlign,
            textShadowColor: showShadow
              ? isDarkText
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(0,0,0,0.65)'
              : 'transparent',
            textShadowRadius: showShadow ? 6 : 0,
            textShadowOffset: showShadow ? { width: 0, height: 2 } : { width: 0, height: 0 },
          },
        ]}
      >
        {overlay.text || ' '}
      </Text>
    </View>
  );
};

// ============================================================
// IMAGE THUMBNAIL STRIP
// ============================================================
interface ThumbnailStripProps {
  images: string[];
  activeIndex: number;
  onSelect: (idx: number) => void;
  onRemove: (idx: number) => void;
  onAdd: () => void;
  bottomInset: number;
}

const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  images,
  activeIndex,
  onSelect,
  onRemove,
  onAdd,
  bottomInset,
}) => {
  return (
    <View style={[styles.thumbnailStripWrap, { bottom: bottomInset + 16 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.thumbnailStripContent}
      >
        {images.map((uri, idx) => (
          <TouchableOpacity
            key={`${uri}-${idx}`}
            style={[
              styles.thumbnailItem,
              idx === activeIndex && styles.thumbnailItemActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(idx);
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onRemove(idx);
            }}
            delayLongPress={400}
            activeOpacity={0.8}
          >
            <Image source={{ uri }} style={styles.thumbnailImage} resizeMode="cover" />
            {idx === activeIndex && (
              <View style={styles.thumbnailActiveBadge}>
                <Ionicons name="eye" size={10} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {images.length < 10 && (
          <TouchableOpacity
            style={styles.thumbnailAdd}
            onPress={onAdd}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text style={styles.thumbnailAddText}>{images.length}/10</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// ============================================================
// TOOL RAIL
// ============================================================
const ToolRail: React.FC<{
  activeTool: ActiveTool;
  onSelect: (t: ActiveTool) => void;
}> = ({ activeTool, onSelect }) => {
  const tools = [
    { key: 'text' as const, icon: 'text' as const, label: 'Text' },
    { key: 'stickers' as const, icon: 'happy-outline' as const, label: 'Stickers' },
    { key: 'filters' as const, icon: 'color-filter-outline' as const, label: 'Filters' },
    { key: 'sound' as const, icon: 'musical-notes-outline' as const, label: 'Sound' },
  ];

  return (
    <View style={styles.toolRail} pointerEvents="box-none">
      {tools.map((t) => {
        const isActive = activeTool === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={[styles.toolRailItem, isActive && styles.toolRailItemActive]}
            onPress={() => onSelect(isActive ? null : t.key)}
            activeOpacity={0.7}
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
// LIVE TEXT EDITOR PANEL
// ============================================================
interface LiveTextEditorProps {
  overlay: TextOverlay;
  onChange: (patch: Partial<TextOverlay>) => void;
  onDone: () => void;
  onDelete: () => void;
  onCopyToAll: () => void;
  showCopyToAll: boolean;
  bottomInset: number;
  canDelete: boolean;
}

const LiveTextEditor: React.FC<LiveTextEditorProps> = ({
  overlay,
  onChange,
  onDone,
  onDelete,
  onCopyToAll,
  showCopyToAll,
  bottomInset,
  canDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'color' | 'bg' | 'effects'>(
    'style'
  );

  return (
    <View style={[styles.liveEditor, { paddingBottom: bottomInset + 10 }]}>
      {/* Header */}
      <View style={styles.liveEditorHeader}>
        <TouchableOpacity
          onPress={onDelete}
          disabled={!canDelete}
          style={[styles.liveEditorIconBtn, !canDelete && { opacity: 0.3 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4D6D" />
        </TouchableOpacity>

        <Text style={styles.liveEditorTitle} numberOfLines={1}>
          {overlay.text}
        </Text>

        <TouchableOpacity
          onPress={onDone}
          style={styles.liveEditorDoneBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.liveEditorDoneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Copy to all */}
      {showCopyToAll && (
        <TouchableOpacity
          style={styles.copyToAllBtn}
          onPress={onCopyToAll}
          activeOpacity={0.7}
        >
          <Ionicons name="copy-outline" size={14} color="#2ECC71" />
          <Text style={styles.copyToAllText}>Apply to all images</Text>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.liveEditorTabs}>
        {(
          [
            { key: 'style', label: 'Style', icon: 'text-outline' },
            { key: 'color', label: 'Color', icon: 'color-palette-outline' },
            { key: 'bg', label: 'Background', icon: 'square-outline' },
            { key: 'effects', label: 'Effects', icon: 'sparkles-outline' },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.liveEditorTab, isActive && styles.liveEditorTabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={isActive ? '#4A7DFF' : '#8A8AAE'}
              />
              <Text
                style={[
                  styles.liveEditorTabText,
                  isActive && styles.liveEditorTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.liveEditorContent}>
        {/* STYLE TAB */}
        {activeTab === 'style' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.liveEditorScroll}
          >
            {/* Fonts */}
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
                    overlay.fontFamily === f.family && styles.fontChipActive,
                  ]}
                  onPress={() => onChange({ fontFamily: f.family })}
                >
                  <Text
                    style={[
                      styles.fontChipText,
                      { fontFamily: f.family },
                      overlay.fontFamily === f.family && styles.fontChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Size */}
            <Text style={[styles.optionLabel, { marginTop: 12 }]}>Size</Text>
            <View style={styles.chipRow}>
              {FONT_SIZE_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={`size-${preset.key}`}
                  style={[
                    styles.sizeChip,
                    overlay.fontSize === preset.size && styles.sizeChipActive,
                  ]}
                  onPress={() => onChange({ fontSize: preset.size })}
                >
                  <Text
                    style={[
                      styles.sizeChipText,
                      overlay.fontSize === preset.size && styles.sizeChipTextActive,
                    ]}
                  >
                    {preset.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Style toggles */}
            <Text style={[styles.optionLabel, { marginTop: 12 }]}>Style</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.styleToggle,
                  overlay.fontWeight === 'bold' && styles.styleToggleActive,
                ]}
                onPress={() =>
                  onChange({
                    fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold',
                  })
                }
              >
                <Text
                  style={[
                    styles.styleToggleText,
                    { fontWeight: 'bold' },
                    overlay.fontWeight === 'bold' && styles.styleToggleTextActive,
                  ]}
                >
                  B
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.styleToggle,
                  overlay.fontStyle === 'italic' && styles.styleToggleActive,
                ]}
                onPress={() =>
                  onChange({
                    fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
              >
                <Text
                  style={[
                    styles.styleToggleText,
                    { fontStyle: 'italic' },
                    overlay.fontStyle === 'italic' && styles.styleToggleTextActive,
                  ]}
                >
                  I
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.styleToggle,
                  overlay.textDecorationLine === 'underline' && styles.styleToggleActive,
                ]}
                onPress={() =>
                  onChange({
                    textDecorationLine:
                      overlay.textDecorationLine === 'underline' ? 'none' : 'underline',
                  })
                }
              >
                <Text
                  style={[
                    styles.styleToggleText,
                    { textDecorationLine: 'underline' },
                    overlay.textDecorationLine === 'underline' && styles.styleToggleTextActive,
                  ]}
                >
                  U
                </Text>
              </TouchableOpacity>

              <View style={styles.alignGroup}>
                <TouchableOpacity
                  style={[
                    styles.styleToggleSmall,
                    overlay.textAlign === 'left' && styles.styleToggleActive,
                  ]}
                  onPress={() => onChange({ textAlign: 'left' })}
                >
                  <Ionicons
                    name="text-outline"
                    size={14}
                    color={overlay.textAlign === 'left' ? '#4A7DFF' : '#FFFFFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.styleToggleSmall,
                    overlay.textAlign === 'center' && styles.styleToggleActive,
                  ]}
                  onPress={() => onChange({ textAlign: 'center' })}
                >
                  <Ionicons
                    name="reorder-two-outline"
                    size={14}
                    color={overlay.textAlign === 'center' ? '#4A7DFF' : '#FFFFFF'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.styleToggleSmall,
                    overlay.textAlign === 'right' && styles.styleToggleActive,
                  ]}
                  onPress={() => onChange({ textAlign: 'right' })}
                >
                  <Ionicons
                    name="text"
                    size={14}
                    color={overlay.textAlign === 'right' ? '#4A7DFF' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* COLOR TAB */}
        {activeTab === 'color' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.liveEditorScroll}
          >
            <Text style={styles.optionLabel}>Text color</Text>
            <View style={styles.colorGrid}>
              {TEXT_COLORS.map((c) => (
                <TouchableOpacity
                  key={`color-${c}`}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    overlay.color === c && styles.colorDotSelected,
                  ]}
                  onPress={() => onChange({ color: c })}
                />
              ))}
            </View>

            <Text style={[styles.optionLabel, { marginTop: 14 }]}>
              Opacity — {Math.round(overlay.opacity * 100)}%
            </Text>
            <View style={styles.sliderRow}>
              {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                <TouchableOpacity
                  key={`op-${o}`}
                  style={[
                    styles.sliderChip,
                    Math.abs(overlay.opacity - o) < 0.05 && styles.sliderChipActive,
                  ]}
                  onPress={() => onChange({ opacity: o })}
                >
                  <Text
                    style={[
                      styles.sliderChipText,
                      Math.abs(overlay.opacity - o) < 0.05 && styles.sliderChipTextActive,
                    ]}
                  >
                    {Math.round(o * 100)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* BACKGROUND TAB */}
        {activeTab === 'bg' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.liveEditorScroll}
          >
            <Text style={styles.optionLabel}>Highlight background</Text>
            <View style={styles.colorGrid}>
              {TEXT_BG_COLORS.map((bg) => {
                const isSelected = (overlay.backgroundColor ?? null) === bg.value;
                return (
                  <TouchableOpacity
                    key={`bg-${bg.key}`}
                    style={[
                      styles.bgColorDot,
                      bg.value === null && styles.bgColorDotNone,
                      bg.value !== null && { backgroundColor: bg.value },
                      isSelected && styles.colorDotSelected,
                    ]}
                    onPress={() => onChange({ backgroundColor: bg.value })}
                  >
                    {bg.value === null && (
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.optionLabel, { marginTop: 14 }]}>
              Letter spacing — {overlay.letterSpacing.toFixed(1)}
            </Text>
            <View style={styles.sliderRow}>
              {[0, 1, 2, 4, 6].map((ls) => (
                <TouchableOpacity
                  key={`ls-${ls}`}
                  style={[
                    styles.sliderChip,
                    Math.abs(overlay.letterSpacing - ls) < 0.5 && styles.sliderChipActive,
                  ]}
                  onPress={() => onChange({ letterSpacing: ls })}
                >
                  <Text
                    style={[
                      styles.sliderChipText,
                      Math.abs(overlay.letterSpacing - ls) < 0.5 &&
                        styles.sliderChipTextActive,
                    ]}
                  >
                    {ls}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.optionLabel, { marginTop: 14 }]}>
              Line height — {overlay.lineHeight.toFixed(1)}x
            </Text>
            <View style={styles.sliderRow}>
              {[0.8, 1.0, 1.2, 1.4, 1.6].map((lh) => (
                <TouchableOpacity
                  key={`lh-${lh}`}
                  style={[
                    styles.sliderChip,
                    Math.abs(overlay.lineHeight - lh) < 0.05 && styles.sliderChipActive,
                  ]}
                  onPress={() => onChange({ lineHeight: lh })}
                >
                  <Text
                    style={[
                      styles.sliderChipText,
                      Math.abs(overlay.lineHeight - lh) < 0.05 &&
                        styles.sliderChipTextActive,
                    ]}
                  >
                    {lh.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* EFFECTS TAB */}
        {activeTab === 'effects' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.liveEditorScroll}
          >
            <Text style={styles.optionLabel}>Shadow</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[
                  styles.effectChip,
                  overlay.shadow && styles.effectChipActive,
                ]}
                onPress={() => onChange({ shadow: !overlay.shadow })}
              >
                <Ionicons
                  name="cloudy-outline"
                  size={14}
                  color={overlay.shadow ? '#4A7DFF' : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.effectChipText,
                    overlay.shadow && styles.effectChipTextActive,
                  ]}
                >
                  {overlay.shadow ? 'On' : 'Off'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.optionLabel, { marginTop: 14 }]}>
              Rotation — {Math.round(overlay.rotation)}°
            </Text>
            <View style={styles.sliderRow}>
              {[-15, -5, 0, 5, 15].map((r) => (
                <TouchableOpacity
                  key={`rot-${r}`}
                  style={[
                    styles.sliderChip,
                    Math.abs(overlay.rotation - r) < 2 && styles.sliderChipActive,
                  ]}
                  onPress={() => onChange({ rotation: r })}
                >
                  <Text
                    style={[
                      styles.sliderChipText,
                      Math.abs(overlay.rotation - r) < 2 && styles.sliderChipTextActive,
                    ]}
                  >
                    {r}°
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.optionLabel, { marginTop: 14 }]}>Quick presets</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() =>
                  onChange({
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    fontSize: 28,
                    fontWeight: 'bold',
                    shadow: false,
                  })
                }
              >
                <Text style={styles.presetChipText}>Caption</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() =>
                  onChange({
                    color: '#FFD93D',
                    backgroundColor: null,
                    fontSize: 56,
                    fontWeight: 'bold',
                    shadow: true,
                  })
                }
              >
                <Text style={styles.presetChipText}>Headline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() =>
                  onChange({
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(255,77,109,0.9)',
                    fontSize: 22,
                    fontWeight: 'bold',
                    shadow: false,
                  })
                }
              >
                <Text style={styles.presetChipText}>Tag</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
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

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Edit state — image-only
  const [editImages, setEditImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [activeFilter, setActiveFilter] = useState<string>('none');

  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);

  // Live inline text editor state
  const [isEditingText, setIsEditingText] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);
  const textInputRef = useRef<TextInput | null>(null);

  const [activeStickerTab, setActiveStickerTab] =
    useState<typeof STICKER_TABS[number]>('Emoji');

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

  // Overlays visible on the currently-active image
  const visibleOverlays = useMemo(
    () => textOverlays.filter((o) => o.imageIndex === activeImageIndex),
    [textOverlays, activeImageIndex]
  );

  const selectedOverlay = useMemo(
    () => textOverlays.find((o) => o.id === selectedOverlayId) || null,
    [textOverlays, selectedOverlayId]
  );

  const activeFilterObj = useMemo(
    () => FILTER_PRESETS.find((f) => f.key === activeFilter),
    [activeFilter]
  );

  const isInEditMode = editImages.length > 0;

  // Trash pulse animation
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

  // Auto-request permission on mount (camera opens automatically when granted)
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted && cameraPermission?.canAskAgain !== false) {
        await requestCameraPermission();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCameraReady = useCallback(() => setCameraReady(true), []);

  // ============================================================
  // START EDIT MODE
  // ============================================================
  const startEditForImages = useCallback((uris: string[]) => {
    setEditImages(uris);
    setActiveImageIndex(0);
    setTextOverlays([]);
    setSelectedOverlayId(null);
    setActiveTool(null);
    setActiveFilter('none');
    setIsEditingText(false);
    setDraftText('');
    setEditingOverlayId(null);
  }, []);

  // ============================================================
  // CAPTURE PHOTO
  // ============================================================
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
      startEditForImages([photo.uri]);
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
  }, [isCapturing, startEditForImages, showStyledAlert, hideStyledAlert]);

  // ============================================================
  // PICK FROM GALLERY
  // ============================================================
  const handleGalleryPress = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;

      const uris = result.assets.map((a) => a.uri);
      startEditForImages(uris);
    } catch (err: any) {
      showStyledAlert({
        title: 'Upload failed',
        message: err?.message || 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#E74C3C',
        buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
      });
    }
  }, [startEditForImages, showStyledAlert, hideStyledAlert]);

  // ============================================================
  // ADD MORE IMAGES
  // ============================================================
  const handleAddMoreImages = useCallback(async () => {
    if (editImages.length >= 10) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10 - editImages.length,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;

      const newUris = result.assets.map((a) => a.uri);
      const nextIndex = editImages.length;
      setEditImages((prev) => [...prev, ...newUris]);
      setActiveImageIndex(nextIndex);
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
  }, [editImages.length, showStyledAlert, hideStyledAlert]);

  // ============================================================
  // REMOVE IMAGE
  // ============================================================
  const handleRemoveImage = useCallback(
    (index: number) => {
      if (editImages.length <= 1) {
        showStyledAlert({
          title: 'Cannot remove',
          message: 'You need at least one image.',
          icon: 'alert-circle-outline',
          iconColor: '#E74C3C',
          buttons: [{ text: 'OK', style: 'primary', onPress: hideStyledAlert }],
        });
        return;
      }

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
              setEditImages((prev) => prev.filter((_, i) => i !== index));
              setTextOverlays((prev) =>
                prev
                  .filter((o) => o.imageIndex !== index)
                  .map((o) =>
                    o.imageIndex > index ? { ...o, imageIndex: o.imageIndex - 1 } : o
                  )
              );
              setActiveImageIndex((idx) => {
                if (index < idx) return idx - 1;
                if (index === idx) return Math.max(0, idx - 1);
                return idx;
              });
              setSelectedOverlayId(null);
              setIsEditingText(false);
            },
          },
        ],
      });
    },
    [editImages.length, showStyledAlert, hideStyledAlert]
  );

  // ============================================================
  // CYCLE FLASH
  // ============================================================
  const cycleFlash = useCallback(() => {
    setFlash((prev: FlashMode): FlashMode => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  // ============================================================
  // TEXT TOOL — opens live inline editor immediately
  // ============================================================
  const openTextTool = useCallback(() => {
    Haptics.selectionAsync();

    // If there is already a selected overlay, open editor for it
    if (selectedOverlay) {
      setEditingOverlayId(selectedOverlay.id);
      setDraftText(selectedOverlay.text);
      setIsEditingText(true);
      setTimeout(() => textInputRef.current?.focus(), 80);
      return;
    }

    // Otherwise create a new empty overlay and open the live editor
    const newOverlay = makeDefaultOverlay('', activeImageIndex);
    setTextOverlays((prev) => [...prev, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setEditingOverlayId(newOverlay.id);
    setDraftText('');
    setIsEditingText(true);
    setActiveTool(null);
    setTimeout(() => textInputRef.current?.focus(), 80);
  }, [selectedOverlay, activeImageIndex]);

  // ============================================================
  // EDIT EXISTING OVERLAY (double-tap or from rail)
  // ============================================================
  const editOverlayText = useCallback((overlay: TextOverlay) => {
    setEditingOverlayId(overlay.id);
    setDraftText(overlay.text);
    setIsEditingText(true);
    setActiveTool(null);
    setTimeout(() => textInputRef.current?.focus(), 80);
  }, []);

  // ============================================================
  // UPDATE DRAFT TEXT (live)
  // ============================================================
  const updateDraftText = useCallback(
    (value: string) => {
      setDraftText(value);
      if (editingOverlayId) {
        setTextOverlays((prev) =>
          prev.map((o) =>
            o.id === editingOverlayId ? { ...o, text: value.slice(0, 80) } : o
          )
        );
      }
    },
    [editingOverlayId]
  );

  // ============================================================
  // FINISH TEXT EDITING
  // ============================================================
  const finishTextEditing = useCallback(() => {
    if (editingOverlayId) {
      // If text is empty, remove the overlay
      const overlay = textOverlays.find((o) => o.id === editingOverlayId);
      if (overlay && !overlay.text.trim()) {
        setTextOverlays((prev) => prev.filter((o) => o.id !== editingOverlayId));
        setSelectedOverlayId(null);
      }
    }
    setIsEditingText(false);
    setEditingOverlayId(null);
    setDraftText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [editingOverlayId, textOverlays]);

  // ============================================================
  // ADD STICKER OVERLAY
  // ============================================================
  const addStickerOverlay = useCallback(
    (emoji: string) => {
      const overlay = makeDefaultOverlay(emoji, activeImageIndex);
      overlay.fontSize = 56;
      overlay.shadow = false;
      setTextOverlays((prev) => [...prev, overlay]);
      setSelectedOverlayId(overlay.id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    [activeImageIndex]
  );

  // ============================================================
  // UPDATE SELECTED OVERLAY
  // ============================================================
  const updateSelectedOverlay = useCallback(
    (patch: Partial<TextOverlay>) => {
      if (!selectedOverlayId) return;
      setTextOverlays((prev) =>
        prev.map((o) => (o.id === selectedOverlayId ? { ...o, ...patch } : o))
      );
    },
    [selectedOverlayId]
  );

  // ============================================================
  // DELETE SELECTED OVERLAY
  // ============================================================
  const deleteSelectedOverlay = useCallback(() => {
    if (!selectedOverlayId) return;
    setTextOverlays((prev) => prev.filter((o) => o.id !== selectedOverlayId));
    setSelectedOverlayId(null);
    setIsEditingText(false);
    setEditingOverlayId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [selectedOverlayId]);

  // ============================================================
  // COPY SELECTED OVERLAY TO ALL IMAGES
  // ============================================================
  const copyOverlayToAll = useCallback(() => {
    if (!selectedOverlay) return;
    if (editImages.length <= 1) return;

    const newOverlays: TextOverlay[] = [];
    for (let i = 0; i < editImages.length; i++) {
      if (i === selectedOverlay.imageIndex) continue;
      newOverlays.push({
        ...selectedOverlay,
        id: `t_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        imageIndex: i,
      });
    }

    setTextOverlays((prev) => [...prev, ...newOverlays]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [selectedOverlay, editImages.length]);

  // ============================================================
  // HANDLE PREVIEW TAP
  // ============================================================
  const handlePreviewTap = useCallback(() => {
    if (isEditingText) return; // Don't dismiss while editing
    if (activeTool) {
      Haptics.selectionAsync();
      setActiveTool(null);
    }
    if (selectedOverlayId) {
      setSelectedOverlayId(null);
    }
  }, [activeTool, selectedOverlayId, isEditingText]);

  // ============================================================
  // DISCARD EDIT
  // ============================================================
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
            setEditImages([]);
            setTextOverlays([]);
            setSelectedOverlayId(null);
            setActiveTool(null);
            setActiveFilter('none');
            setActiveImageIndex(0);
            setIsEditingText(false);
            setEditingOverlayId(null);
            setDraftText('');
          },
        },
      ],
    });
  }, [showStyledAlert, hideStyledAlert]);

  // ============================================================
  // GO TO POST DETAILS
  // ============================================================
  const goToPostDetails = useCallback(() => {
    if (editImages.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate('UploadEditor', {
      editResult: {
        uri: editImages[0],
        type: 'image',
        trimStart: 0,
        trimEnd: 0,
        videoThumbnail: null,
        fileSize: null,
        textOverlays,
        extraImages: editImages.slice(1),
        filter: activeFilter,
      },
    });
  }, [editImages, textOverlays, activeFilter, navigation]);

  // ============================================================
  // RENDER: PERMISSION LOADING
  // ============================================================
  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // ============================================================
  // RENDER: PERMISSION DENIED
  // ============================================================
  if (!cameraPermission.granted && !isInEditMode) {
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
  // RENDER: EDIT MODE
  // ============================================================
  if (isInEditMode) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" translucent />

        {/* Full-screen preview + overlay layer */}
        <Pressable
          style={styles.editPreviewWrapper}
          onPress={handlePreviewTap}
          onLayout={(e) => {
            setLayerW(e.nativeEvent.layout.width);
            setLayerH(e.nativeEvent.layout.height);
          }}
        >
          <Image
            source={{ uri: editImages[activeImageIndex] }}
            style={styles.editImage}
            resizeMode="contain"
          />

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
              isEditable={!isEditingText || overlay.id !== editingOverlayId}
              onSelect={() => setSelectedOverlayId(overlay.id)}
              onDoubleTap={() => editOverlayText(overlay)}
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
                if (editingOverlayId === overlay.id) {
                  setIsEditingText(false);
                  setEditingOverlayId(null);
                }
              }}
              onDragStateChange={(dragging, overTrash) => {
                setIsDraggingOverlay(dragging);
                setIsOverTrash(overTrash);
              }}
            />
          ))}

          {/* LIVE INLINE TEXT INPUT — sits on top of the image */}
          {isEditingText && (
            <View style={styles.inlineTextInputWrap} pointerEvents="box-none">
              <TextInput
                ref={textInputRef}
                style={[
                  styles.inlineTextInput,
                  {
                    color:
                      textOverlays.find((o) => o.id === editingOverlayId)?.color ??
                      '#FFFFFF',
                    fontSize:
                      textOverlays.find((o) => o.id === editingOverlayId)?.fontSize ??
                      28,
                    fontFamily:
                      textOverlays.find((o) => o.id === editingOverlayId)?.fontFamily ??
                      'System',
                    fontWeight:
                      textOverlays.find((o) => o.id === editingOverlayId)?.fontWeight ??
                      'bold',
                    fontStyle:
                      textOverlays.find((o) => o.id === editingOverlayId)?.fontStyle ??
                      'normal',
                    textDecorationLine:
                      textOverlays.find((o) => o.id === editingOverlayId)
                        ?.textDecorationLine ?? 'none',
                    textAlign:
                      textOverlays.find((o) => o.id === editingOverlayId)?.textAlign ??
                      'center',
                    letterSpacing:
                      textOverlays.find((o) => o.id === editingOverlayId)?.letterSpacing ??
                      0,
                    lineHeight:
                      (textOverlays.find((o) => o.id === editingOverlayId)?.fontSize ??
                        28) *
                      (textOverlays.find((o) => o.id === editingOverlayId)?.lineHeight ??
                        1.2),
                    backgroundColor:
                      textOverlays.find((o) => o.id === editingOverlayId)
                        ?.backgroundColor ?? 'transparent',
                    textShadowColor:
                      textOverlays.find((o) => o.id === editingOverlayId)?.shadow
                        ? 'rgba(0,0,0,0.65)'
                        : 'transparent',
                    textShadowRadius: textOverlays.find(
                      (o) => o.id === editingOverlayId
                    )?.shadow
                      ? 6
                      : 0,
                    textShadowOffset: textOverlays.find(
                      (o) => o.id === editingOverlayId
                    )?.shadow
                      ? { width: 0, height: 2 }
                      : { width: 0, height: 0 },
                  },
                ]}
                value={draftText}
                onChangeText={updateDraftText}
                placeholder="Type something..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                autoFocus
                maxLength={80}
                blurOnSubmit={false}
                returnKeyType="done"
                onSubmitEditing={finishTextEditing}
              />
            </View>
          )}
        </Pressable>

        {/* Image thumbnail strip — hidden while editing text */}
        {!isEditingText && (
          <ThumbnailStrip
            images={editImages}
            activeIndex={activeImageIndex}
            onSelect={(idx) => {
              setActiveImageIndex(idx);
              setSelectedOverlayId(null);
            }}
            onRemove={handleRemoveImage}
            onAdd={handleAddMoreImages}
            bottomInset={insets.bottom}
          />
        )}

        {/* Trash zone (shown while dragging) */}
        {isDraggingOverlay && (
          <View
            style={[styles.trashZone, { paddingTop: insets.top + 8 }]}
            pointerEvents="none"
          >
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

        {/* Top bar */}
        <View style={[styles.editTopBar, { top: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={discardEdit}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.editTitleRow}>
            <Text style={styles.editTitle}>
              Edit {editImages.length > 1 ? `${activeImageIndex + 1}/${editImages.length}` : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={goToPostDetails}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tool rail — hidden while editing text */}
        {!isEditingText && (
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
                if (t === 'text') {
                  openTextTool();
                } else {
                  Haptics.selectionAsync();
                  setActiveTool(t);
                }
              }}
            />
          </View>
        )}

        {/* LIVE TEXT EDITOR PANEL */}
        {isEditingText && selectedOverlay && (
          <LiveTextEditor
            overlay={selectedOverlay}
            onChange={updateSelectedOverlay}
            onDone={finishTextEditing}
            onDelete={deleteSelectedOverlay}
            onCopyToAll={copyOverlayToAll}
            showCopyToAll={editImages.length > 1}
            bottomInset={insets.bottom}
            canDelete={!!selectedOverlay.text.trim()}
          />
        )}

        {/* Tool sheet (stickers / filters / sound) */}
        {!isEditingText && activeTool && (
          <View style={[styles.toolSheet, { paddingBottom: insets.bottom + 12 }]}>
            {/* ================ STICKERS ================ */}
            {activeTool === 'stickers' && (
              <>
                <View style={styles.toolSheetHeader}>
                  <Text style={styles.toolSheetTitle}>Stickers</Text>
                </View>
                <View style={styles.stickerTabs}>
                  {STICKER_TABS.map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.stickerTab,
                        activeStickerTab === tab && styles.stickerTabActive,
                      ]}
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
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.stickerGrid}
                >
                  {(activeStickerTab === 'Emoji' ? EMOJI_STICKERS : SHAPE_STICKERS).map(
                    (emoji, idx) => (
                      <TouchableOpacity
                        key={`${emoji}-${idx}`}
                        style={styles.stickerCell}
                        onPress={() => addStickerOverlay(emoji)}
                      >
                        <Text style={styles.stickerEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </ScrollView>
              </>
            )}

            {/* ================ FILTERS ================ */}
            {activeTool === 'filters' && (
              <>
                <View style={styles.toolSheetHeader}>
                  <Text style={styles.toolSheetTitle}>Filters</Text>
                  <Text style={styles.toolSheetHintSmall}>Applied to all images</Text>
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
                        {f.overlay === null && (
                          <Ionicons name="close" size={14} color="#FFFFFF" />
                        )}
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

            {/* ================ SOUND ================ */}
            {activeTool === 'sound' && (
              <View style={styles.toolSheetHeader}>
                <Text style={styles.toolSheetTitle}>Sound</Text>
                <Text style={styles.toolSheetHint}>Sound library coming soon.</Text>
              </View>
            )}
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
      </KeyboardAvoidingView>
    );
  }

  // ============================================================
  // RENDER: CAMERA MODE (image-only)
  // ============================================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />

      {isFocused && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          mode="picture"
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
          <Text style={styles.modeTextActive}>PHOTO</Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={cycleFlash}>
          <Ionicons
            name={
              flash === 'on' ? 'flash' : flash === 'auto' ? 'flash-outline' : 'flash-off'
            }
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </LinearGradient>

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
            onPress={takePhoto}
            disabled={isCapturing || !cameraReady}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFacing((prev: CameraType): CameraType =>
              prev === 'back' ? 'front' : 'back'
            );
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
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  modeTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
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
  uploadLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
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
  editPreviewWrapper: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
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

  // Tool rail
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

  // Tool sheet
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
  toolSheetHintSmall: { color: '#6A7A9E', fontSize: 11 },
  toolSheetHint: { color: '#8A8AAE', fontSize: 12, lineHeight: 16, marginTop: 4 },
  toolSheetScroll: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 16,
  },
  optionLabel: {
    color: '#8A8AAE',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  // Live text editor
  liveEditor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,15,26,0.98)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: SCREEN_HEIGHT * 0.52,
    zIndex: 50,
  },
  liveEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveEditorIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,109,0.12)',
  },
  liveEditorTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  liveEditorDoneBtn: {
    backgroundColor: '#4A7DFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
  },
  liveEditorDoneText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  copyToAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(46,204,113,0.12)',
    marginBottom: 10,
  },
  copyToAllText: {
    color: '#2ECC71',
    fontSize: 12,
    fontWeight: '600',
  },

  liveEditorTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 10,
  },
  liveEditorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  liveEditorTabActive: { backgroundColor: 'rgba(74,125,255,0.15)' },
  liveEditorTabText: { color: '#8A8AAE', fontSize: 11, fontWeight: '600' },
  liveEditorTabTextActive: { color: '#4A7DFF' },
  liveEditorContent: { maxHeight: SCREEN_HEIGHT * 0.32 },
  liveEditorScroll: { paddingBottom: 8 },

  // Chips and toggles
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  colorDotSelected: { borderColor: '#4A7DFF', borderWidth: 3 },
  bgColorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgColorDotNone: {
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },
  sizeChip: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: 10,
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

  styleToggle: {
    width: 40,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  styleToggleSmall: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  styleToggleActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  styleToggleText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  styleToggleTextActive: { color: '#4A7DFF' },
  alignGroup: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },

  sliderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sliderChip: {
    minWidth: 48,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sliderChipActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  sliderChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  sliderChipTextActive: { color: '#4A7DFF' },

  effectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  effectChipActive: {
    backgroundColor: 'rgba(74,125,255,0.25)',
    borderColor: '#4A7DFF',
  },
  effectChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  effectChipTextActive: { color: '#4A7DFF' },

  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  presetChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

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

  // Thumbnail strip
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
  thumbnailActiveBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4A7DFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    gap: 2,
  },
  thumbnailAddText: { color: '#8A8AAE', fontSize: 9, fontWeight: '600' },

  // Text overlay
  textOverlayWrapper: { position: 'absolute' },
  textOverlayText: {
    fontWeight: '800',
  },
  textOverlaySelected: {
    borderWidth: 1.5,
    borderColor: '#4A7DFF',
    borderStyle: 'dashed',
    borderRadius: 8,
  },

  // Inline text input
  inlineTextInputWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 60,
  },
  inlineTextInput: {
    minWidth: 100,
    maxWidth: '95%',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
});