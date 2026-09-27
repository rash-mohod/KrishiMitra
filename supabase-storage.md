# Equipment image storage

The backend uses the Supabase Storage bucket `equipment-images` and stores image URLs/paths in `equipment.image_urls`.

For the current simple version, the owner can submit image URLs in the equipment create/update payload. A backend multipart upload endpoint can be added later without changing the database model.

Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend code or `.env` files exposed to Vite.
