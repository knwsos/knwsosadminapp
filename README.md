# knΩsos
Modern science education website with a protected admin dashboard.

## Netlify setup
Connect this repository to Netlify, then add these Environment Variables:
- ADMIN_PASSWORD = your-admin-password
- SESSION_SECRET = a long random secret string

Never put secrets in source files. The code reads them only from environment variables.

Open `/admin` to manage articles. Admin can create, edit, publish/unpublish, and delete articles.

Articles are stored persistently using Netlify Blobs.
