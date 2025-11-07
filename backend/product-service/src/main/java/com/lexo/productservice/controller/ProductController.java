package com.lexo.productservice.controller;

import com.lexo.productservice.entity.Product;
import com.lexo.productservice.service.ProductService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow CORS from frontend
@Validated // Enable method-level validation
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable @NotNull Long id) {
        Objects.requireNonNull(id, "Product ID must not be null");
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody @NotNull Product product) {
        Objects.requireNonNull(product, "Product must not be null");
        Product createdProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable @NotNull Long id, 
            @Valid @RequestBody @NotNull Product product) {
        Objects.requireNonNull(id, "Product ID must not be null");
        Objects.requireNonNull(product, "Product must not be null");
        try {
            Product updatedProduct = productService.updateProduct(id, product);
            return ResponseEntity.ok(updatedProduct);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable @NotNull Long id) {
        Objects.requireNonNull(id, "Product ID must not be null");
        try {
            productService.deleteProduct(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam @NotNull @Size(min = 2) String keyword) {
        Objects.requireNonNull(keyword, "Search keyword must not be null");
        return ResponseEntity.ok(productService.searchProducts(keyword));
    }

    @PostMapping("/upload-url")
    public ResponseEntity<Map<String, String>> generateUploadUrl(
            @RequestBody Map<String, String> request) {
        String fileName = request.get("fileName");
        String contentType = request.getOrDefault("contentType", "image/jpeg");
        
        String presignedUrl = productService.generateImageUploadUrl(fileName, contentType);
        
        return ResponseEntity.ok(Map.of("presignedUrl", presignedUrl));
    }
}


