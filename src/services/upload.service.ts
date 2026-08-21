// src/services/upload.service.ts

import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';

export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}

class UploadService {
  private readonly BUCKETS = {
    AVATARS: 'avatars',
    SHOP_LOGOS: 'shop_logos',
  };

  async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return false;
    }
    return true;
  }

  async pickImage(options?: {
    allowsEditing?: boolean;
    quality?: number;
    aspect?: [number, number];
  }): Promise<ImagePicker.ImagePickerAsset | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: options?.allowsEditing ?? true,
      quality: options?.quality ?? 0.8,
      aspect: options?.aspect,
    });

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return result.assets[0];
  }

  async uploadImage(
    file: ImagePicker.ImagePickerAsset,
    bucket: string,
    path: string
  ): Promise<UploadResult | null> {
    try {
      let fileData: Blob | Uint8Array;
      let contentType: string;

      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        fileData = blob;
        contentType = blob.type || 'image/jpeg';
      } else {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        fileData = new Uint8Array(arrayBuffer);
        contentType = blob.type || 'image/jpeg';
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, fileData, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        url: publicUrl,
        path: data?.path || path,
        bucket: bucket,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }

  async uploadAvatar(
    userId: string,
    file: ImagePicker.ImagePickerAsset
  ): Promise<UploadResult | null> {
    const path = `${userId}/avatar_${Date.now()}.jpg`;
    return this.uploadImage(file, this.BUCKETS.AVATARS, path);
  }

  async uploadShopLogo(
    shopId: string,
    file: ImagePicker.ImagePickerAsset
  ): Promise<UploadResult | null> {
    const path = `${shopId}/logo_${Date.now()}.jpg`;
    return this.uploadImage(file, this.BUCKETS.SHOP_LOGOS, path);
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);

      if (error) {
        console.error('Update avatar error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Update avatar error:', error);
      return false;
    }
  }

  getAvatarUrl(userId: string, avatarUrl?: string | null): string {
    if (avatarUrl) {
      const separator = avatarUrl.includes('?') ? '&' : '?';
      return `${avatarUrl}${separator}v=${Date.now()}`;
    }
    return `https://ui-avatars.com/api/?name=User&background=4A7DFF&color=fff&size=200`;
  }

  getShopLogoUrl(shopId: string, logoUrl?: string | null): string {
    if (logoUrl) {
      const separator = logoUrl.includes('?') ? '&' : '?';
      return `${logoUrl}${separator}v=${Date.now()}`;
    }
    return `https://ui-avatars.com/api/?name=Shop&background=6B94FF&color=fff&size=200`;
  }
}

export const uploadService = new UploadService();