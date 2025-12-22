/*
  # Remove Unused Indexes

  This migration removes indexes that have not been used according to database
  statistics. This reduces storage overhead and improves write performance.

  1. Removed Indexes
    - idx_task_attachments_task_id (unused)
    - idx_task_comments_task_id (unused)
    - idx_calendar_events_date (unused)
    - chat_messages_conversation_idx (unused)
    - chat_messages_sender_idx (unused)
    - idx_meeting_notes_created_at (unused)
    - idx_meeting_notes_channel_id (unused)

  Note: These can be recreated if query patterns change in the future.
*/

DROP INDEX IF EXISTS public.idx_task_attachments_task_id;
DROP INDEX IF EXISTS public.idx_task_comments_task_id;
DROP INDEX IF EXISTS public.idx_calendar_events_date;
DROP INDEX IF EXISTS public.chat_messages_conversation_idx;
DROP INDEX IF EXISTS public.chat_messages_sender_idx;
DROP INDEX IF EXISTS public.idx_meeting_notes_created_at;
DROP INDEX IF EXISTS public.idx_meeting_notes_channel_id;