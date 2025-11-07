# S3 Bucket CORS Configuration Guide

Your S3 bucket `atb-product-images` needs to be configured to allow cross-origin requests from your frontend.

## Option 1: Configure via AWS Console (Easiest)

1. **Go to AWS S3 Console**: https://console.aws.amazon.com/s3/
2. **Click on your bucket**: `atb-product-images`
3. **Go to Permissions tab**
4. **Scroll down to "Cross-origin resource sharing (CORS)"**
5. **Click "Edit"**
6. **Paste this configuration**:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

7. **Click "Save changes"**

## Option 2: Configure via AWS CLI

```bash
aws s3api put-bucket-cors \
  --bucket atb-product-images \
  --cors-configuration file://s3-cors-config.json \
  --region us-east-2
```

## Option 3: Use the Java Utility (Programmatic)

Run the `S3CorsConfigurator` utility class (see below) to configure CORS programmatically.

## For Production

When deploying to production, update the `AllowedOrigins` to include your production domain:

```json
"AllowedOrigins": [
  "http://localhost:3000",
  "https://your-production-domain.com"
]
```

