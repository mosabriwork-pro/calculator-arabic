# Setup Guide - Login Gate Configuration

## Quick Start

### 1. Create Environment File

Create a `.env.local` file in the root directory:

```env
APP_SECRET=your-super-secret-key-here-make-it-long-and-random-at-least-32-characters
```

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Access Codes

For each user, generate their access code:

```bash
node scripts/generate-code.js user@example.com
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` - you'll be redirected to `/login`

## Testing the Login Gate

1. **Generate a test access code:**
   ```bash
   node scripts/generate-code.js test@example.com
   ```

2. **Visit the login page:**
   - Go to `http://localhost:3000/login`
   - Enter the email and access code

3. **Access the calculator:**
   - After successful login, you'll be redirected to `/app`
   - The calculator will show with your email as a watermark

## Security Notes

- **APP_SECRET**: Keep this secret and use a strong random key
- **Access Codes**: Are deterministic - same email always generates same code
- **Sessions**: Last 30 days, automatically expire
- **Cookies**: HttpOnly, secure, and protected from XSS

## Production Deployment

1. Set `APP_SECRET` in your hosting environment
2. Ensure HTTPS is enabled (required for secure cookies)
3. Use a strong, unique secret key
4. Consider rate limiting for `/api/login`

## Troubleshooting

- **"Cannot find module" errors**: Run `npm install` again
- **Login not working**: Check that APP_SECRET matches between generation and server
- **Redirect loops**: Clear browser cookies and try again 