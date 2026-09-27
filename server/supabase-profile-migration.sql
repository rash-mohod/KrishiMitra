-- KrishiMitra profile photo storage migration
-- Run this once in Supabase SQL Editor.
-- Profile photos are optional. The backend uploads them using the Supabase service role.

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- The application/API enforces exactly 10 numeric digits for new and edited phone numbers.
-- Existing legacy phone values are intentionally not modified by this migration.

-- Remove the old temporary/stock profile photos from existing accounts.
-- Real user-uploaded photos stored elsewhere are left untouched.
update public.profiles
set profile_image = null
where profile_image ilike '%images.unsplash.com%'
   or profile_image ilike '%unsplash.com%';
