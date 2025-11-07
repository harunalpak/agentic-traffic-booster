# Fix S3 Bucket Permissions for Image Display

The broken images are caused by S3 bucket permissions. Your bucket needs to allow public read access (or use presigned URLs for private access).

## Option 1: Make S3 Objects Publicly Readable (Easiest for Development)

### Step 1: Configure Bucket Policy

1. Go to AWS S3 Console: https://console.aws.amazon.com/s3/
2. Click on your bucket: `atb-product-images`
3. Go to **Permissions** tab
4. Scroll to **Bucket policy**
5. Click **Edit**
6. Paste this policy (allows public read access to all objects):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::atb-product-images/*"
    }
  ]
}
```

**Important:** Replace `atb-product-images` with your actual bucket name if different.

7. Click **Save changes**

### Step 2: Configure Block Public Access Settings

1. Still in **Permissions** tab
2. Scroll to **Block public access (bucket settings)**
3. Click **Edit**
4. **Uncheck** the following (to allow public access):
   - ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ✅ Block public access to buckets and objects granted through new public bucket or access point policies
   - ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies

5. Click **Save changes**
6. Type `confirm` when prompted

### Step 3: Verify CORS Configuration

Make sure CORS is configured (for GET requests to display images):

1. In **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Ensure this configuration is present:

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

5. Click **Save changes**

## Option 2: Use Presigned URLs for Private Access (More Secure)

If you want to keep images private, you'll need to generate presigned GET URLs on the backend. This requires code changes:

1. Add an endpoint to generate presigned GET URLs
2. Modify the frontend to fetch presigned URLs before displaying images

**This is more complex but more secure for production.**

## Quick Fix Summary

**The fastest solution is Option 1** - make your S3 bucket publicly readable:

1. ✅ Add bucket policy (allows public GetObject)
2. ✅ Disable "Block public access" settings  
3. ✅ Configure CORS (for GET requests)

This will allow images to display immediately without code changes.

## Quick Test

After configuring permissions:

1. Try accessing an image URL directly in your browser:
   ```
   https://atb-product-images.s3.us-east-2.amazonaws.com/products/[your-image-key]
   ```

2. If you see the image, permissions are correct
3. If you get "Access Denied", permissions need adjustment

## For Production

For production, consider:
- Using CloudFront CDN in front of S3
- Implementing presigned URLs for better security
- Using IAM roles instead of public access
- Setting up proper CORS for your production domain

## Troubleshooting

**Still seeing broken images?**

1. **Check the image URL format** - Open browser DevTools → Network tab → See what URL is being requested
2. **Verify bucket name** - Make sure it matches `atb-product-images`
3. **Check region** - Ensure region is `us-east-2` (or update if different)
4. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
5. **Check S3 object exists** - Go to S3 console and verify the file exists at that path

