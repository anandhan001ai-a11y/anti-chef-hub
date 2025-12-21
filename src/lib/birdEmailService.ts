/**
 * Bird Email Service
 * For sending task notifications via Bird API (formerly MessageBird)
 * 
 * Setup: Configure your Bird API credentials in .env:
 * - VITE_BIRD_API_KEY=your_api_key
 * - VITE_BIRD_WORKSPACE_ID=your_workspace_id  
 * - VITE_BIRD_CHANNEL_ID=your_email_channel_id
 * - VITE_BIRD_FROM_EMAIL=your_sender_email
 */

interface EmailPayload {
    to: string;
    subject: string;
    body: string;
    html?: string;
}

interface TaskEmailData {
    taskTitle: string;
    assigneeName: string;
    assigneeEmail: string;
    priority: string;
    dueDate?: string;
    notes?: string;
}

class BirdEmailService {
    private apiKey: string;
    private workspaceId: string;
    private channelId: string;
    private fromEmail: string;
    private baseUrl = 'https://api.bird.com';

    constructor() {
        // Load from environment variables
        this.apiKey = import.meta.env.VITE_BIRD_API_KEY || '';
        this.workspaceId = import.meta.env.VITE_BIRD_WORKSPACE_ID || '';
        this.channelId = import.meta.env.VITE_BIRD_CHANNEL_ID || '';
        this.fromEmail = import.meta.env.VITE_BIRD_FROM_EMAIL || 'noreply@chefanandhub.com';
    }

    /**
     * Check if Bird is configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.workspaceId && this.channelId);
    }

    /**
     * Send an email via Bird API
     */
    async sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
        if (!this.isConfigured()) {
            console.warn('⚠️ Bird Email not configured, using mailto fallback');
            return this.fallbackMailto(payload);
        }

        try {
            const endpoint = `${this.baseUrl}/workspaces/${this.workspaceId}/channels/${this.channelId}/messages`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `AccessKey ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    receiver: {
                        contacts: [{ identifierValue: payload.to }]
                    },
                    body: {
                        type: 'html',
                        html: {
                            from: { email: this.fromEmail, name: 'ChefAnand Hub' },
                            subject: payload.subject,
                            html: payload.html || `<p>${payload.body.replace(/\n/g, '<br>')}</p>`
                        }
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('❌ Bird API error:', error);
                return { success: false, error };
            }

            console.log('✅ Email sent via Bird API');
            return { success: true };

        } catch (error) {
            console.error('❌ Bird Email error:', error);
            return { success: false, error: String(error) };
        }
    }

    /**
     * Fallback to mailto: link when Bird is not configured
     */
    private fallbackMailto(payload: EmailPayload): { success: boolean; error?: string } {
        const subject = encodeURIComponent(payload.subject);
        const body = encodeURIComponent(payload.body);
        window.open(`mailto:${payload.to}?subject=${subject}&body=${body}`, '_blank');
        return { success: true };
    }

    /**
     * Send a task assignment notification email
     */
    async sendTaskNotification(data: TaskEmailData): Promise<{ success: boolean; error?: string }> {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📋 New Task Assigned</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
                    <p style="font-size: 16px; color: #374151;">Hi <strong>${data.assigneeName}</strong>,</p>
                    <p style="font-size: 16px; color: #374151;">You have been assigned a new task:</p>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid ${data.priority === 'High' ? '#ef4444' : data.priority === 'Medium' ? '#f59e0b' : '#22c55e'
            }; margin: 20px 0;">
                        <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 20px;">${data.taskTitle}</h2>
                        <p style="margin: 5px 0; color: #6b7280;">
                            <strong>Priority:</strong> 
                            <span style="color: ${data.priority === 'High' ? '#ef4444' : data.priority === 'Medium' ? '#f59e0b' : '#22c55e'}; font-weight: bold;">
                                ${data.priority}
                            </span>
                        </p>
                        ${data.dueDate ? `<p style="margin: 5px 0; color: #6b7280;"><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
                        ${data.notes ? `<p style="margin: 10px 0 0 0; color: #374151;">${data.notes}</p>` : ''}
                    </div>
                    
                    <p style="font-size: 16px; color: #374151;">Please complete this task as soon as possible.</p>
                    
                    <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                        Best regards,<br>
                        <strong>ChefAnand Hub</strong>
                    </p>
                </div>
                <div style="background: #111827; padding: 15px; border-radius: 0 0 10px 10px; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        Powered by ChefAnand Hub | Staff Management System
                    </p>
                </div>
            </div>
        `;

        const plainText = `Hi ${data.assigneeName},

You have been assigned a new task:

Task: ${data.taskTitle}
Priority: ${data.priority}
Due Date: ${data.dueDate || 'Not set'}
${data.notes ? `Notes: ${data.notes}` : ''}

Please complete this task as soon as possible.

Best regards,
ChefAnand Hub`;

        return this.sendEmail({
            to: data.assigneeEmail,
            subject: `📋 New Task: ${data.taskTitle}`,
            body: plainText,
            html
        });
    }
}

// Export singleton instance
export const birdEmailService = new BirdEmailService();
