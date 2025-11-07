package com.lexo.productservice.service;

import com.lexo.productservice.entity.Product;
import com.lexo.productservice.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final S3Service s3Service;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(@NonNull Long id) {
        return productRepository.findById(id);
    }

    @NonNull
    public Product createProduct(@NonNull Product product) {
        return Objects.requireNonNull(productRepository.save(product), "Failed to save product");
    }

    @NonNull
    public Product updateProduct(@NonNull Long id, @NonNull Product updated) {
        Product existing = Objects.requireNonNull(
            productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found")),
            "Product must not be null"
        );
    
        if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getPrice() != null) existing.setPrice(updated.getPrice());
        if (updated.getImageUrl() != null) existing.setImageUrl(updated.getImageUrl());
        if (updated.getProductUrl() != null) existing.setProductUrl(updated.getProductUrl());
        if (updated.getTags() != null) existing.setTags(updated.getTags());
        if (updated.getBullets() != null) existing.setBullets(updated.getBullets());
    
        return Objects.requireNonNull(productRepository.save(existing), "Failed to update product");
    }

    public void deleteProduct(@NonNull Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }
        productRepository.deleteById(id);
    }

    public List<Product> searchProducts(@NonNull String keyword) {
        return productRepository.findByTitleOrTagsContaining(keyword);
    }

    public String generateImageUploadUrl(String fileName, String contentType) {
        return s3Service.generatePresignedUrl(fileName, contentType);
    }
}


