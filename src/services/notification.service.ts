// src/services/notification.service.ts

import { supabase } from '../lib/supabase';

const supabaseAny = supabase as any;

export class NotificationService {
  // ============================================================
  // SEND NEGOTIATION NOTIFICATION
  // ============================================================
  async sendNegotiationNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      // Save to notifications table
      const { error } = await supabaseAny
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'negotiation',
          title: title,
          body: body,
          data: data,
          read: false,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Get user's push tokens
      const { data: tokens } = await supabaseAny
        .from('push_tokens')
        .select('token, device_type')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (tokens && tokens.length > 0) {
        // Send push notifications
        await this.sendPushNotifications(tokens, title, body, data);
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // ============================================================
  // SEND PUSH NOTIFICATIONS
  // ============================================================
  private async sendPushNotifications(
    tokens: { token: string; device_type: string }[],
    title: string,
    body: string,
    data: Record<string, any>
  ): Promise<void> {
    // This is a placeholder for actual push notification implementation
    // You would integrate with Expo Push Notifications or Firebase Cloud Messaging
    console.log(`📱 Sending push notification to ${tokens.length} devices`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log(`Data:`, data);

    // Example with Expo (if using Expo)
    // for (const token of tokens) {
    //   await sendExpoPushNotification(token.token, { title, body, data });
    // }
  }

  // ============================================================
  // GET USER NOTIFICATIONS
  // ============================================================
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabaseAny
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // ============================================================
  // MARK NOTIFICATION AS READ
  // ============================================================
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAny
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAny
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // ============================================================
  // GET UNREAD COUNT
  // ============================================================
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAny
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;