/*
  # Add Missing Foreign Key Indexes

  This migration adds indexes for foreign key columns that were missing indexes,
  which improves query performance for JOINs and lookups.

  1. New Indexes
    - `idx_channels_created_by` on channels(created_by)
    - `idx_chat_messages_reply_to` on chat_messages(reply_to)
    - `idx_chat_messages_task_id` on chat_messages(task_id)
    - `idx_message_reads_user_id` on message_reads(user_id)
    - `idx_messages_task_id` on messages(task_id)
    - `idx_roster_uploads_uploaded_by` on roster_uploads(uploaded_by)
*/

CREATE INDEX IF NOT EXISTS idx_channels_created_by ON public.channels(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON public.chat_messages(reply_to);
CREATE INDEX IF NOT EXISTS idx_chat_messages_task_id ON public.chat_messages(task_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_roster_uploads_uploaded_by ON public.roster_uploads(uploaded_by);