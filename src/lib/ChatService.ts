import { supabase } from './supabase';

// Types
export interface Channel {
    id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    created_by?: string;
    created_at: string;
    unread_count?: number;
}

export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    other_user_name?: string;
    other_user_status?: 'online' | 'away' | 'offline';
    created_at: string;
    last_message?: string;
    unread_count?: number;
}

export interface ChatMessage {
    id: string;
    channel_id?: string;
    conversation_id?: string;
    sender_id: string;
    sender_name: string;
    content?: string;
    message_type: 'text' | 'voice' | 'image' | 'task';
    media_url?: string;
    media_duration?: number; // For voice messages
    task_id?: string;
    task_title?: string;
    task_status?: string;
    reply_to?: string;
    created_at: string;
    is_read?: boolean;
    read_by?: string[];
}

export interface UserPresence {
    user_id: string;
    user_name: string;
    status: 'online' | 'away' | 'offline';
    last_seen: string;
}

// Default channels for kitchen
export const DEFAULT_CHANNELS: Omit<Channel, 'id' | 'created_at'>[] = [
    { name: 'kitchen-general', description: 'General kitchen announcements', icon: '🍳', color: 'orange' },
    { name: 'prep-station', description: 'Prep team coordination', icon: '🥬', color: 'green' },
    { name: 'pastry-team', description: 'Pastry section', icon: '🧁', color: 'pink' },
    { name: 'shift-handover', description: 'Shift change notes', icon: '🔄', color: 'blue' },
    { name: 'urgent-alerts', description: 'Critical updates only', icon: '🚨', color: 'red' },
];

class ChatService {
    private currentUserId: string | null = null;
    private currentUserName: string = 'Chef';

    // Initialize with current user
    async init() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            this.currentUserId = user.id;
            // Get user name from profile
            const profile = localStorage.getItem('chef_profile');
            if (profile) {
                const parsed = JSON.parse(profile);
                this.currentUserName = parsed.name || 'Chef';
            }
            // Update presence to online
            await this.updatePresence('online');
        }
        return this.currentUserId;
    }

    getCurrentUserId() {
        return this.currentUserId;
    }

    getCurrentUserName() {
        return this.currentUserName;
    }

    // ==================== CHANNELS ====================

    async getChannels(): Promise<Channel[]> {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error fetching channels:', error);
            return this.getDefaultChannels();
        }

        if (!data || data.length === 0) {
            return this.getDefaultChannels();
        }

        return data;
    }

    private getDefaultChannels(): Channel[] {
        return DEFAULT_CHANNELS.map((ch, i) => ({
            ...ch,
            id: `default-${i}`,
            created_at: new Date().toISOString(),
        }));
    }

    async createChannel(channel: Omit<Channel, 'id' | 'created_at'>): Promise<Channel | null> {
        const { data, error } = await supabase
            .from('channels')
            .insert({
                ...channel,
                created_by: this.currentUserId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating channel:', error);
            return {
                ...channel,
                id: `temp-${Date.now()}`,
                created_at: new Date().toISOString(),
            };
        }

        return data;
    }

    // ==================== MESSAGES ====================

    async getMessages(channelId?: string, conversationId?: string, limit = 100): Promise<ChatMessage[]> {
        // Try Supabase first
        let query = supabase.from('chat_messages').select('*');

        if (channelId) {
            query = query.eq('channel_id', channelId);
        } else if (conversationId) {
            query = query.eq('conversation_id', conversationId);
        }

        const { data, error } = await query
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error fetching messages:', error);
            // Fall back to existing messages table or local
            return this.getLegacyMessages();
        }

        return data || [];
    }

    private async getLegacyMessages(): Promise<ChatMessage[]> {
        // Try old messages table
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(100);

        if (data) {
            return data.map((msg: any) => ({
                id: msg.id,
                sender_id: msg.user_name,
                sender_name: msg.user_name,
                content: msg.content,
                message_type: msg.task_id ? 'task' : 'text',
                task_id: msg.task_id,
                task_title: msg.task_title,
                task_status: msg.task_status,
                created_at: msg.created_at,
            }));
        }

        return [];
    }

    async sendMessage(message: Partial<ChatMessage>): Promise<ChatMessage | null> {
        const newMessage = {
            ...message,
            sender_id: this.currentUserId,
            sender_name: this.currentUserName,
            message_type: message.message_type || 'text',
            created_at: new Date().toISOString(),
        };

        // Try new chat_messages table
        const { data, error } = await supabase
            .from('chat_messages')
            .insert(newMessage)
            .select()
            .single();

        if (error) {
            console.error('Error sending to chat_messages:', error);
            // Fall back to old messages table for text messages
            if (message.message_type === 'text' || !message.message_type) {
                const { data: legacyData, error: legacyError } = await supabase
                    .from('messages')
                    .insert({
                        user_name: this.currentUserName,
                        content: message.content,
                        task_id: message.task_id,
                        task_title: message.task_title,
                    })
                    .select()
                    .single();

                if (!legacyError && legacyData) {
                    return {
                        id: legacyData.id,
                        sender_id: this.currentUserId || '',
                        sender_name: this.currentUserName,
                        content: legacyData.content,
                        message_type: 'text',
                        created_at: legacyData.created_at,
                    };
                }
            }
            return null;
        }

        return data;
    }

    // ==================== VOICE MESSAGES ====================

    async uploadVoiceMessage(audioBlob: Blob, channelId?: string, conversationId?: string): Promise<ChatMessage | null> {
        const fileName = `voice_${Date.now()}.webm`;
        const filePath = `voice-messages/${this.currentUserId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, audioBlob, {
                contentType: 'audio/webm',
            });

        if (uploadError) {
            console.error('Error uploading voice message:', uploadError);
            // Create as data URL for local fallback
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const dataUrl = reader.result as string;
                    const message = await this.sendMessage({
                        channel_id: channelId,
                        conversation_id: conversationId,
                        message_type: 'voice',
                        media_url: dataUrl,
                        content: '🎤 Voice message',
                    });
                    resolve(message);
                };
                reader.readAsDataURL(audioBlob);
            });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath);

        // Create message with voice URL
        return this.sendMessage({
            channel_id: channelId,
            conversation_id: conversationId,
            message_type: 'voice',
            media_url: publicUrl,
            content: '🎤 Voice message',
        });
    }

    // ==================== IMAGE MESSAGES ====================

    async uploadImage(file: File, channelId?: string, conversationId?: string): Promise<ChatMessage | null> {
        // Compress image if needed
        const compressedFile = await this.compressImage(file);

        const fileName = `img_${Date.now()}_${file.name}`;
        const filePath = `images/${this.currentUserId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('chat-media')
            .upload(filePath, compressedFile, {
                contentType: file.type,
            });

        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            // Create as data URL for local fallback
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const dataUrl = reader.result as string;
                    const message = await this.sendMessage({
                        channel_id: channelId,
                        conversation_id: conversationId,
                        message_type: 'image',
                        media_url: dataUrl,
                        content: '📷 Photo',
                    });
                    resolve(message);
                };
                reader.readAsDataURL(compressedFile);
            });
        }

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(filePath);

        return this.sendMessage({
            channel_id: channelId,
            conversation_id: conversationId,
            message_type: 'image',
            media_url: publicUrl,
            content: '📷 Photo',
        });
    }

    private async compressImage(file: File): Promise<Blob> {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Max dimensions
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 1200;

                let { width, height } = img;

                if (width > MAX_WIDTH) {
                    height = (height * MAX_WIDTH) / width;
                    width = MAX_WIDTH;
                }
                if (height > MAX_HEIGHT) {
                    width = (width * MAX_HEIGHT) / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => resolve(blob || file),
                    'image/jpeg',
                    0.8
                );
            };

            img.src = URL.createObjectURL(file);
        });
    }

    // ==================== PRESENCE ====================

    async updatePresence(status: 'online' | 'away' | 'offline') {
        if (!this.currentUserId) return;

        const { error } = await supabase
            .from('user_presence')
            .upsert({
                user_id: this.currentUserId,
                user_name: this.currentUserName,
                status,
                last_seen: new Date().toISOString(),
            });

        if (error) {
            console.error('Error updating presence:', error);
        }
    }

    async getOnlineUsers(): Promise<UserPresence[]> {
        const { data, error } = await supabase
            .from('user_presence')
            .select('*')
            .neq('status', 'offline');

        if (error) {
            console.error('Error fetching online users:', error);
            return [];
        }

        return data || [];
    }

    // ==================== READ RECEIPTS ====================

    async markAsRead(messageId: string) {
        if (!this.currentUserId) return;

        await supabase
            .from('message_reads')
            .upsert({
                message_id: messageId,
                user_id: this.currentUserId,
                read_at: new Date().toISOString(),
            });
    }

    async getReadReceipts(messageIds: string[]): Promise<Record<string, string[]>> {
        const { data } = await supabase
            .from('message_reads')
            .select('message_id, user_id')
            .in('message_id', messageIds);

        const receipts: Record<string, string[]> = {};
        data?.forEach((r: any) => {
            if (!receipts[r.message_id]) receipts[r.message_id] = [];
            receipts[r.message_id].push(r.user_id);
        });

        return receipts;
    }

    // ==================== REAL-TIME SUBSCRIPTIONS ====================

    subscribeToChannel(channelId: string, onMessage: (msg: ChatMessage) => void) {
        return supabase
            .channel(`chat-${channelId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
            }, (payload) => {
                onMessage(payload.new as ChatMessage);
            })
            .subscribe();
    }

    subscribeToConversation(conversationId: string, onMessage: (msg: ChatMessage) => void) {
        return supabase
            .channel(`dm-${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `conversation_id=eq.${conversationId}`,
            }, (payload) => {
                onMessage(payload.new as ChatMessage);
            })
            .subscribe();
    }

    // Also subscribe to legacy messages table for backward compatibility
    subscribeToLegacyMessages(onMessage: (msg: ChatMessage) => void) {
        return supabase
            .channel('legacy-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const msg = payload.new as any;
                onMessage({
                    id: msg.id,
                    sender_id: msg.user_name,
                    sender_name: msg.user_name,
                    content: msg.content,
                    message_type: msg.task_id ? 'task' : 'text',
                    task_id: msg.task_id,
                    task_title: msg.task_title,
                    created_at: msg.created_at,
                });
            })
            .subscribe();
    }

    subscribeToTyping(roomId: string, onTyping: (userName: string) => void) {
        return supabase
            .channel(`typing-${roomId}`)
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.user_name !== this.currentUserName) {
                    onTyping(payload.payload.user_name);
                }
            })
            .subscribe();
    }

    broadcastTyping(roomId: string) {
        supabase.channel(`typing-${roomId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_name: this.currentUserName },
        });
    }

    // Cleanup
    async cleanup() {
        await this.updatePresence('offline');
    }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
