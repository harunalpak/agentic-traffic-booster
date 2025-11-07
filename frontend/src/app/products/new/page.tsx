"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCreateProduct, usePresignedUrl } from "@/hooks/useProducts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"

const productSchema = z.object({
  title: z.string().min(1, "Title is required").min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  productUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createProduct = useCreateProduct()
  const presignedUrlMutation = usePresignedUrl()
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      productUrl: "",
      imageUrl: "",
    },
  })

  const imageUrl = watch("imageUrl")

  const handleImageUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      // Generate unique filename
      const fileName = `${Date.now()}-${file.name}`
      const contentType = file.type || "image/jpeg"

      // Get presigned URL
      const presignedUrl = await presignedUrlMutation.mutateAsync({
        fileName,
        contentType,
      })

      // Upload to S3 - Direct upload using presigned URL
      // Use native fetch to avoid axios interceptors adding Authorization headers
      // Note: S3 bucket must have CORS configured to allow requests from this origin
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`)
      }

      // Extract the S3 URL (presigned URL without query params)
      const s3Url = presignedUrl.split("?")[0]
      setValue("imageUrl", s3Url)
      setImagePreview(URL.createObjectURL(file))

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
    } catch (error: any) {
      console.error("Upload error:", error)
      let errorMessage = "Failed to upload image"
      
      // Check if it's a CORS error
      if (error.message?.includes("CORS") || error.code === "ERR_FAILED") {
        errorMessage = "CORS error: Please configure S3 bucket CORS settings. See S3_CORS_SETUP.md"
      }
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      await createProduct.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        price: data.price,
        productUrl: data.productUrl || undefined,
        imageUrl: data.imageUrl || undefined,
      })

      toast({
        title: "Success",
        description: "Product created successfully",
      })

      router.push("/products")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">
          Create a new product in your catalog
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter product title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter product description"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productUrl">Product URL</Label>
                <Input
                  id="productUrl"
                  type="url"
                  {...register("productUrl")}
                  placeholder="https://example.com/product"
                />
                {errors.productUrl && (
                  <p className="text-sm text-destructive">
                    {errors.productUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setValue("imageUrl", "")
                      setImagePreview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 rounded-md object-cover"
                  />
                </div>
              )}
              {imageUrl && !imagePreview && (
                <div className="mt-4">
                  <img
                    src={imageUrl}
                    alt="Product"
                    className="h-32 w-32 rounded-md object-cover"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

