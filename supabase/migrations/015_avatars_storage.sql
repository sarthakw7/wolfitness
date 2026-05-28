-- Storage bucket + policies for user profile avatars.
-- Bucket is public for simple rendering via public URL.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

-- Note: On Supabase cloud, `storage.objects` is managed and not owned by the
-- migration role, so `ALTER TABLE storage.objects ...` will fail. Storage RLS
-- is enabled by default; we only define policies here.

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_user_write" on storage.objects;
create policy "avatars_user_write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars_user_update" on storage.objects;
create policy "avatars_user_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars_user_delete" on storage.objects;
create policy "avatars_user_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);
