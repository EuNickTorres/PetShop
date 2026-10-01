# Supabase setup

The application uses Supabase Auth and Postgres for the private agenda.

## 1. Configure the database

Open the Supabase project, go to **SQL Editor**, create a new query, paste the
contents of `migrations/202609300001_initial_agenda.sql`, and run it once.

## 2. Create the owner account

In **Authentication > Users**, create Dayana's user with her email and a strong
temporary password. Keep email confirmation enabled for public sign-ups, but do
not enable public sign-up in the application.

## 3. Configure environment variables

Copy the Project URL and Publishable key from the project's **Connect** dialog.
Set them locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never expose or commit the database password, secret key, or `service_role`
key. This application does not need them.
