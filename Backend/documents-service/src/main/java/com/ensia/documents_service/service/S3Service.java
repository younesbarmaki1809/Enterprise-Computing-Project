package com.ensia.documents_service.service;

import com.ensia.documents_service.service.dto.PresignedUrlResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "aws.s3.enabled", havingValue = "true", matchIfMissing = false)
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Value("${aws.s3.presign-expiration-minutes:10}")
    private long presignExpirationMinutes;

    public S3Service(S3Client s3Client, S3Presigner presigner) {
        this.s3Client = s3Client;
        this.presigner = presigner;
    }

    public String uploadFile(MultipartFile file) throws IOException {
        String key = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        
        return key;
    }

    public byte[] downloadFile(String key) throws IOException {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        try (ResponseInputStream<GetObjectResponse> response = s3Client.getObject(request)) {
            return response.readAllBytes();
        }
    }

    public void deleteFile(String key) {
        DeleteObjectRequest request = DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build();

        s3Client.deleteObject(request);
    }

        public PresignedUrlResponse createPresignedUpload(String fileName, String contentType) {
        String key = UUID.randomUUID().toString() + "_" + fileName;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .contentType(contentType)
            .build();

        Duration duration = Duration.ofMinutes(presignExpirationMinutes);
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(duration)
            .putObjectRequest(putObjectRequest)
            .build();

        String url = presigner.presignPutObject(presignRequest).url().toString();

        return new PresignedUrlResponse(url, key, Instant.now().plus(duration), "PUT");
        }

        public PresignedUrlResponse createPresignedDownload(String key) {
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
            .bucket(bucket)
            .key(key)
            .build();

        Duration duration = Duration.ofMinutes(presignExpirationMinutes);
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
            .signatureDuration(duration)
            .getObjectRequest(getObjectRequest)
            .build();

        String url = presigner.presignGetObject(presignRequest).url().toString();

        return new PresignedUrlResponse(url, key, Instant.now().plus(duration), "GET");
        }
}
