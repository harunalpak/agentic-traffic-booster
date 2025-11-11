# Campaign Management - Setup Guide

## 🎯 Overview

The Campaign Management feature has been successfully implemented in the ATB Dashboard. This allows users to create and manage automated traffic campaigns linked to products across different platforms (Twitter, YouTube, Pinterest).

## ✅ What Was Implemented

### 1. **Environment Configuration**
- `.env.local.example` - Template for environment variables
- Need to create `.env.local` with:
  ```
  NEXT_PUBLIC_PRODUCT_API=http://localhost:8080/api
  NEXT_PUBLIC_CAMPAIGN_API=http://localhost:8082/api
  ```

### 2. **API Client Updates** (`src/lib/api-client.ts`)
- Created separate axios instances for each microservice:
  - `apiProducts` → Product Service (port 8080)
  - `apiCampaigns` → Campaign Service (port 8082)
- Both clients share the same interceptors (auth, error handling)
- Backward compatible (default export is `apiProducts`)

### 3. **Type Definitions**
- `src/types/campaign.ts` - Campaign types:
  - `Campaign`, `CampaignCreateRequest`, `ChannelType`
  - `Channel` enum: TWITTER, YOUTUBE, PINTEREST
  - `CampaignStatus` enum: DRAFT, ACTIVE, PAUSED, COMPLETED
- `src/types/product.ts` - Added `ProductLite` for selectors

### 4. **TanStack Query Hooks**
- `src/hooks/useCampaigns.ts`:
  - `useCampaigns()` - List all campaigns
  - `useCampaign(id)` - Get single campaign
  - `useCreateCampaign()` - Create mutation
  - `usePauseCampaign()` - Pause mutation
  - `useResumeCampaign()` - Resume mutation
  - `useDeleteCampaign()` - Delete mutation
- `src/hooks/useProductsLite.ts` - Fetch products for picker
- `src/hooks/useProducts.ts` - Updated to use `apiProducts` client

### 5. **Zustand Store** (`src/stores/useCampaignWizard.ts`)
- Wizard state management for multi-step form
- Tracks: productId, channel, name, dailyLimit, dates, config
- Actions: setProduct, setChannel, setBasics, setConfig, reset

### 6. **Zod Validators** (`src/lib/validators/campaign.ts`)
- `campaignBasicsSchema` - Name, dailyLimit, dates validation
- `twitterConfigSchema` - minFollowerCount, hashtags
- `youtubeConfigSchema` - minSubscribers, keywords
- `pinterestConfigSchema` - minFollowers, boards

### 7. **UI Components**

#### Shared Components (`src/components/ui/`)
- `badge.tsx` - For status/channel badges ✨ NEW
- `skeleton.tsx` - Loading skeletons ✨ NEW

#### Campaign Components (`src/components/campaigns/`)
- `WizardStepper.tsx` - Visual step indicator
- `ProductSelector.tsx` - Searchable product picker
- `ChannelSelector.tsx` - Radio cards for channels
- `CampaignBasicsForm.tsx` - Name, daily limit, dates form
- `ChannelConfigForm.tsx` - Dynamic config based on channel

### 8. **Pages**

#### `/app/campaigns/page.tsx` - Campaign List
- Table with columns: Name, Product, Channel, Daily Limit, Status, Dates, Actions
- Actions: Pause, Resume, Delete
- Empty state with CTA to create first campaign
- Error handling with friendly messages

#### `/app/campaigns/new/page.tsx` - Campaign Wizard
**5-Step Wizard:**
1. **Select Product** - Searchable product selector
2. **Choose Channel** - Twitter, YouTube, or Pinterest
3. **Basic Info** - Name, daily limit, start/end dates
4. **Configure** - Channel-specific settings (hashtags, keywords, etc.)
5. **Review** - Summary and confirmation

### 9. **Navigation**
- Updated `src/components/layout/Sidebar.tsx`
- Added "Campaigns" link with Target icon between Products and Analytics

## 🚀 How to Use

### 1. Setup Environment

Create `frontend/.env.local`:
```bash
NEXT_PUBLIC_PRODUCT_API=http://localhost:8080/api
NEXT_PUBLIC_CAMPAIGN_API=http://localhost:8082/api
```

### 2. Start Both Services

```bash
# Terminal 1 - Product Service
cd backend/product-service
mvn spring-boot:run

# Terminal 2 - Campaign Service
cd backend/campaign-service
mvn spring-boot:run

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### 3. Access the UI

Open [http://localhost:3000/campaigns](http://localhost:3000/campaigns)

## 📝 Usage Flow

### Creating a Campaign

1. Click **"New Campaign"** button
2. **Step 1:** Search and select a product
3. **Step 2:** Choose platform (Twitter/YouTube/Pinterest)
4. **Step 3:** Enter campaign details:
   - Campaign name (required)
   - Daily action limit (positive integer)
   - Start date (optional)
   - End date (optional)
5. **Step 4:** Configure channel-specific settings:
   - **Twitter:** Min followers, hashtags
   - **YouTube:** Min subscribers, keywords
   - **Pinterest:** Min followers, boards
6. **Step 5:** Review and confirm

### Managing Campaigns

**On the campaign list:**
- **Play button** - Activate DRAFT or resume PAUSED campaign
- **Pause button** - Pause ACTIVE campaign
- **Trash button** - Delete campaign (with confirmation)

## 🎨 Channel Configuration Examples

### Twitter Campaign
```json
{
  "minFollowerCount": 500,
  "hashtags": ["#sale", "#promo", "#deal"]
}
```

### YouTube Campaign
```json
{
  "minSubscribers": 1000,
  "keywords": ["review", "unboxing", "tech"]
}
```

### Pinterest Campaign
```json
{
  "minFollowers": 300,
  "boards": ["Fashion", "Home Decor", "Lifestyle"]
}
```

## 🔧 Technical Details

### State Management
- **TanStack Query** - Server state (campaigns, products)
- **Zustand** - Client state (wizard flow)
- **React Hook Form + Zod** - Form validation

### API Communication
- Separate axios clients per microservice
- Automatic JWT token injection (if present)
- 401 redirect to /login
- 10-second timeout
- Proper error handling with toasts

### Validation
- **Client-side:** React Hook Form + Zod schemas
- **Server-side:** Backend validation (campaign-service)
- User-friendly error messages

## 🐛 Troubleshooting

### Campaign service not reachable
**Error:** Network error when fetching campaigns

**Solution:**
1. Check campaign-service is running on port 8082
2. Verify `NEXT_PUBLIC_CAMPAIGN_API` in `.env.local`
3. Check CORS is configured (should allow localhost:3000)

### Products not loading in wizard
**Error:** Product selector shows no results

**Solution:**
1. Check product-service is running on port 8080
2. Verify `NEXT_PUBLIC_PRODUCT_API` in `.env.local`
3. Ensure you have products in the database

### Validation errors
**Error:** Form shows "Daily limit must be positive integer"

**Solution:**
- Daily limit must be > 0
- Must be a whole number (no decimals)

## 📦 Dependencies

All required dependencies should already be installed:
- `@tanstack/react-query` - Server state
- `zustand` - Client state
- `react-hook-form` - Forms
- `zod` - Validation
- `@hookform/resolvers` - Form + Zod integration
- `axios` - HTTP client
- `lucide-react` - Icons

## ✨ Features

✅ **Multi-step wizard** with visual progress indicator  
✅ **Searchable product selector** with images  
✅ **Dynamic channel configuration** based on platform  
✅ **Form validation** with Zod schemas  
✅ **Status management** (pause/resume)  
✅ **CRUD operations** with optimistic updates  
✅ **Error handling** with toast notifications  
✅ **Loading states** with skeletons  
✅ **Empty states** with CTAs  
✅ **Responsive design** with Tailwind CSS  

## 🔐 Security Notes

- JWT tokens automatically attached (when implemented)
- 401 responses redirect to /login
- CORS configured for localhost:3000
- Input sanitization via Zod validation

## 🎯 Next Steps

1. ✅ **Backend running** - Start both microservices
2. ✅ **Environment configured** - Create `.env.local`
3. ✅ **Frontend running** - `npm run dev`
4. 📝 **Test the flow** - Create a test campaign
5. 📝 **Verify integrations** - Check product selection works
6. 📝 **Test status changes** - Try pause/resume/delete

## 📚 File Structure

```
frontend/
├── .env.local.example           # NEW: Environment template
├── src/
│   ├── app/
│   │   └── campaigns/
│   │       ├── page.tsx         # NEW: Campaign list
│   │       └── new/
│   │           └── page.tsx     # NEW: Create wizard
│   ├── components/
│   │   ├── campaigns/           # NEW: Campaign components
│   │   │   ├── WizardStepper.tsx
│   │   │   ├── ProductSelector.tsx
│   │   │   ├── ChannelSelector.tsx
│   │   │   ├── CampaignBasicsForm.tsx
│   │   │   └── ChannelConfigForm.tsx
│   │   ├── layout/
│   │   │   └── Sidebar.tsx      # UPDATED: Added Campaigns link
│   │   └── ui/
│   │       ├── badge.tsx        # NEW
│   │       └── skeleton.tsx     # NEW
│   ├── hooks/
│   │   ├── useCampaigns.ts      # NEW
│   │   ├── useProductsLite.ts   # NEW
│   │   └── useProducts.ts       # UPDATED: Use apiProducts
│   ├── lib/
│   │   ├── api-client.ts        # UPDATED: Multi-service support
│   │   └── validators/
│   │       └── campaign.ts      # NEW
│   ├── stores/
│   │   └── useCampaignWizard.ts # NEW
│   └── types/
│       ├── campaign.ts          # NEW
│       └── product.ts           # UPDATED: Added ProductLite
```

---

**Status:** ✅ **Ready for Use**

The Campaign Management feature is fully implemented and ready to use. Start the backend services and enjoy creating automated traffic campaigns! 🚀

