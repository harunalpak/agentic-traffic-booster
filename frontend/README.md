# Agentic Traffic Booster - Frontend

Modern Next.js 14 frontend for the Agentic Traffic Booster SaaS dashboard.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: 
  - TanStack Query (server state)
  - Zustand (local UI state)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Charts**: Recharts (ready for analytics module)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Home (redirects to /products)
│   │   ├── login/              # Login page
│   │   └── products/           # Product management pages
│   │       ├── page.tsx        # Product listing
│   │       ├── new/            # Add new product
│   │       └── [id]/           # Edit product
│   ├── components/
│   │   ├── layout/               # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   │   └── useProducts.ts      # Product API hooks
│   ├── lib/                    # Utilities
│   │   ├── api-client.ts       # Axios client with interceptors
│   │   └── utils.ts            # Helper functions
│   ├── stores/                 # Zustand stores
│   │   └── useUiStore.ts       # UI state management
│   └── types/                  # TypeScript types
│       └── product.ts          # Product types
```

## Features

### Product Management
- ✅ Product listing with search
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ Image upload via S3 presigned URLs
- ✅ Form validation with Zod

### Authentication
- JWT token management
- Automatic token attachment to requests
- 401 redirect to login

### UI Components
- Modern, responsive design
- Toast notifications
- Loading states
- Error handling

## API Integration

The frontend connects to the Spring Boot backend at `/api/products`:

- `GET /api/products` - List all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product
- `GET /api/products/search?keyword=...` - Search products
- `POST /api/products/upload-url` - Get S3 presigned URL

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Next Steps

- [ ] Add authentication API integration
- [ ] Implement campaign management module
- [ ] Add analytics dashboard with charts
- [ ] Add pagination to product list
- [ ] Implement product categories/tags management
- [ ] Add dark mode toggle

