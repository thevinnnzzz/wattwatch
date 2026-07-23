# Setting a User as Admin

Admin accounts must be set directly in the Supabase database — there is no in-app option to grant admin privileges.

## Prerequisites
- Access to the Supabase project dashboard (SQL Editor)
- The user must already have a registered account in the app

## Steps

1. Open the **Supabase Dashboard** → **SQL Editor**

2. Find the user's ID. Run this to list all users:
   ```sql
   SELECT id, full_name, role FROM public.profiles;
   ```

3. Promote the user to admin by their ID:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
   ```
   Replace `<user-uuid>` with the actual UUID from step 2.

4. Verify the change:
   ```sql
   SELECT id, full_name, role FROM public.profiles WHERE role = 'admin';
   ```

## What the admin can do

Once promoted, the user will see an **Admin Panel** button on their Profile screen. The Admin Panel allows:

- **Update the rate per kWh** — changes the active electricity rate used across the app
- **Toggle demo data generation** — enables or disables the "Generate Data" buttons on the Analytics screen

## Notes

- The `role` column defaults to `'user'` for all new sign-ups
- Only one role value is recognized: `'admin'` (case-sensitive)
- RLS policies restrict admin operations to users with `role = 'admin'`
- No in-app API or screen can modify the `role` field — it is database-only by design
