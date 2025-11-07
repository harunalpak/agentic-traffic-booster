# Frontend Project Structure

## Complete File Tree

```
frontend/
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── README.md                   # Project documentation
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
│
└── src/
    ├── app/                    # Next.js App Router
    │   ├── dashboard-layout.tsx    # Dashboard layout wrapper
    │   ├── globals.css             # Global styles
    │   ├── layout.tsx              # Root layout with providers
    │   ├── page.tsx                # Home page (redirects to /products)
    │   ├── providers.tsx           # TanStack Query provider
    │   │
    │   ├── login/
    │   │   └── page.tsx            # Login page
    │   │
    │   └── products/
    │       ├── layout.tsx          # Products layout
    │       ├── page.tsx            # Product listing page
    │       ├── new/
    │       │   └── page.tsx        # Add new product page
    │       └── [id]/
    │           ├── layout.tsx       # Product detail layout
    │           └── page.tsx        # Edit product page
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Sidebar.tsx         # Navigation sidebar
    │   │   └── Topbar.tsx           # Top navigation bar
    │   │
    │   └── ui/                      # shadcn/ui components
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── table.tsx
    │       ├── textarea.tsx
    │       ├── toast.tsx
    │       ├── toaster.tsx
    │       └── use-toast.ts
    │
    ├── hooks/
    │   └── useProducts.ts           # Product API hooks (TanStack Query)
    │
    ├── lib/
    │   ├── api-client.ts            # Axios client with JWT interceptors
    │   └── utils.ts                 # Utility functions (cn helper)
    │
    ├── stores/
    │   └── useUiStore.ts            # Zustand store for UI state
    │
    └── types/
        └── product.ts               # TypeScript types for products
```

## Key Features Implemented

### ✅ Configuration
- Next.js 14 with App Router
- TypeScript with strict mode
- Tailwind CSS with custom theme
- shadcn/ui component library
- ESLint configuration

### ✅ State Management
- **TanStack Query**: Server state (products, mutations)
- **Zustand**: UI state (modals, filters)

### ✅ API Integration
- Axios client with interceptors
- JWT token management
- 401 redirect handling
- S3 presigned URL upload

### ✅ Pages
- **Login**: Authentication page
- **Products List**: Table view with search
- **New Product**: Form with validation
- **Edit Product**: Update existing products

### ✅ Components
- Layout: Sidebar, Topbar
- UI: Button, Input, Table, Card, Toast, etc.
- Form validation with Zod
- Image upload with preview

### ✅ Features
- Product CRUD operations
- Image upload via S3
- Search functionality
- Toast notifications
- Loading states
- Error handling

## Next Steps for Expansion

1. **Campaign Module**: `/campaigns` pages
2. **Analytics Module**: `/analytics` with Recharts
3. **Settings**: User preferences
4. **Pagination**: Add to product list
5. **Categories/Tags**: Management UI
6. **Dark Mode**: Theme toggle

