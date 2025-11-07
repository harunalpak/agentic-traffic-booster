package com.lexo.productservice.util;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.util.Arrays;

/**
 * Utility class to configure CORS on S3 bucket.
 * Run this once to set up CORS for your S3 bucket.
 */
public class S3CorsConfigurator {

    public static void configureCors(S3Client s3Client, String bucketName) {
        // Create CORS rules
        CORSRule corsRule = CORSRule.builder()
                .allowedOrigins(Arrays.asList(
                        "http://localhost:3000",
                        "http://localhost:3001"
                ))
                .allowedMethods(Arrays.asList(
                        "GET", "PUT", "POST", "DELETE", "HEAD"
                ))
                .allowedHeaders(Arrays.asList("*"))
                .exposeHeaders(Arrays.asList(
                        "ETag",
                        "x-amz-server-side-encryption",
                        "x-amz-request-id",
                        "x-amz-id-2"
                ))
                .maxAgeSeconds(3000)
                .build();

        CORSConfiguration corsConfiguration = CORSConfiguration.builder()
                .corsRules(Arrays.asList(corsRule))
                .build();

        PutBucketCorsRequest putBucketCorsRequest = PutBucketCorsRequest.builder()
                .bucket(bucketName)
                .corsConfiguration(corsConfiguration)
                .build();

        try {
            s3Client.putBucketCors(putBucketCorsRequest);
            System.out.println("CORS configuration applied successfully to bucket: " + bucketName);
        } catch (Exception e) {
            System.err.println("Error configuring CORS: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

