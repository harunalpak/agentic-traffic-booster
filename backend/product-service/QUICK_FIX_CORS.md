# Quick Fix: S3 CORS Error

## The Problem
Your frontend (`http://localhost:3000`) is trying to upload images directly to S3, but S3 is blocking the request due to CORS policy.

## Quick Solution (5 minutes)

### Step 1: Open AWS Console
Go to: https://console.aws.amazon.com/s3/

### Step 2: Find Your Bucket
Click on: `atb-product-images`

### Step 3: Configure CORS
1. Click the **"Permissions"** tab
2. Scroll down to **"Cross-origin resource sharing (CORS)"**
3. Click **"Edit"**
4. **Delete** any existing configuration
5. **Paste** this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **"Save changes"**

### Step 4: Test
Go back to your frontend and try uploading an image again. It should work now!

## Alternative: AWS CLI (if you have it installed)

```bash
aws s3api put-bucket-cors \
  --bucket atb-product-images \
  --cors-configuration file://s3-cors-config.json \
  --region us-east-2
```

## For Production
When you deploy, add your production domain to `AllowedOrigins`:

```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://your-production-domain.com"
]
```

