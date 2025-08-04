# Customer Service Guide - Access Code Generation

## How to Generate Access Codes for Buyers

### Method 1: Node.js Script (Recommended)

1. **Open terminal/command prompt**
2. **Navigate to the project folder**
3. **Run the script with the buyer's email:**

```bash
node scripts/generate-code.js buyer@example.com
```

**Example Output:**
```
📧 Email: buyer@example.com
🔑 Access Code: A6FD93B8

Send this code to the user for login.
```

### Method 2: Python Script (Alternative)

```bash
python scripts/generate-code.py buyer@example.com
```

### Method 3: One-liner (Node.js)

```bash
node -e "const crypto = require('crypto'); const email = 'buyer@example.com'; const secret = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788'; console.log(crypto.createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex').substring(0,8).toUpperCase());"
```

## Test Examples

With your secret, these emails generate these codes:

| Email | Access Code |
|-------|-------------|
| buyer@example.com | A6FD93B8 |
| talal200265@gmail.com | 556ED13B |

## What to Tell the Buyer

1. **Send them the access code**
2. **Tell them to visit:** `http://localhost:3000/login` (or your domain)
3. **Enter their email and the access code**
4. **They'll be redirected to the calculator**

## Important Notes

- ✅ **Same email always generates the same code**
- ✅ **Codes never expire (only sessions expire after 30 days)**
- ✅ **No database needed**
- ✅ **Case-insensitive email input**
- ✅ **Codes are 8 characters, uppercase letters and numbers**

## Troubleshooting

- **Wrong code?** Check that the email is exactly correct
- **Can't login?** Make sure they're using the right email + code combination
- **Script not working?** Make sure Node.js is installed 