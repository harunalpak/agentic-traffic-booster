package com.atb.socialengine.service;

import com.atb.socialengine.dto.ProductDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * ProductClientService - Communicates with product-service
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProductClientService {
    
    private final WebClient.Builder webClientBuilder;
    
    @Value("${product.service.url:http://localhost:8080}")
    private String productServiceUrl;
    
    /**
     * Fetch product information by ID
     */
    @SuppressWarnings("null")
    public ProductDto getProductById(Long productId) {
        try {
            log.info("Fetching product {} from: {}", productId, productServiceUrl);
            
            WebClient webClient = webClientBuilder.baseUrl(productServiceUrl).build();
            
            return webClient.get()
                    .uri("/api/products/" + productId)
                    .retrieve()
                    .bodyToMono(ProductDto.class)
                    .block();
                    
        } catch (Exception e) {
            log.error("Error fetching product {}", productId, e);
            return null;
        }
    }
}

