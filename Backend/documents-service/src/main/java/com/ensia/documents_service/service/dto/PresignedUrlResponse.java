package com.ensia.documents_service.service.dto;

import java.time.Instant;

public record PresignedUrlResponse(
        String url,
        String key,
        Instant expiresAt,
        String method
) {
}
