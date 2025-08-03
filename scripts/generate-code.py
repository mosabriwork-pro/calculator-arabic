#!/usr/bin/env python3
import hmac
import hashlib
import sys

# Your actual APP_SECRET
APP_SECRET = '9f3a6b1d2e4c5a7f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fa1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef001122334455667788'

def generate_access_code(email):
    """Generate access code from email using HMAC-SHA256"""
    normalized = email.strip().lower()
    h = hmac.new(APP_SECRET.encode(), normalized.encode(), hashlib.sha256)
    return h.hexdigest()[:8].upper()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/generate-code.py <email>")
        print("Example: python scripts/generate-code.py user@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    access_code = generate_access_code(email)
    
    print(f"\n📧 Email: {email}")
    print(f"🔑 Access Code: {access_code}")
    print(f"\nSend this code to the user for login.\n") 