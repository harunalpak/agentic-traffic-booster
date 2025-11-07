"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useProduct, useUpdateProduct, usePresignedUrl } from "@/hooks/useProducts"
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

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const productId = Number(params.id)
  const { data: product, isLoading } = useProduct(productId)
  const updateProduct = useUpdateProduct()
  const presignedUrlMutation = usePresignedUrl()
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  })

  const imageUrl = watch("imageUrl")

  // Reset form when product data loads
  React.useEffect(() => {
    if (product) {
      reset({
        title: product.title,
        description: product.description || "",
        price: product.price,
        productUrl: product.productUrl || "",
        imageUrl: product.imageUrl || "",
      })
      if (product.imageUrl) {
        setImagePreview(product.imageUrl)
        setImageError(false) // Reset error state when loading new product
      } else {
        setImagePreview(null)
        setImageError(false)
      }
    }
  }, [product, reset])

  const handleImageUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    try {
      const fileName = `${Date.now()}-${file.name}`
      const contentType = file.type || "image/jpeg"

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
      await updateProduct.mutateAsync({
        id: productId,
        product: {
          title: data.title,
          description: data.description || undefined,
          price: data.price,
          productUrl: data.productUrl || undefined,
          imageUrl: data.imageUrl || undefined,
        },
      })

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      router.push("/products")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground">
          Update product information
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
                      setImageError(false)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {(imagePreview || imageUrl) && (
                <div className="mt-4">
                  {!imageError ? (
                    <img
                      src={imagePreview || imageUrl || ""}
                      alt="Product"
                      className="h-32 w-32 rounded-md object-cover border"
                      onError={() => {
                        setImageError(true)
                        console.error("Failed to load image:", imagePreview || imageUrl)
                      }}
                      onLoad={() => setImageError(false)}
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-md border border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/50">
                      <div className="text-center p-2">
                        <p className="text-xs text-muted-foreground">Image not available</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload a new image</p>
                      </div>
                    </div>
                  )}
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
                {isSubmitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

