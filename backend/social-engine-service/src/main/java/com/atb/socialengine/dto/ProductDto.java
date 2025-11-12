package com.atb.socialengine.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for Product information from product-service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    
    private Long id;
    private String title;
    private String description;
    private String amazonUrl;
    private Double price;
    private String category;
    private String imageUrl;
}

