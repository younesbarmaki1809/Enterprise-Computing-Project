package com.ensia.documents_service.service.event;

import java.time.Instant;

public record DocumentUploadedEvent(
        String eventId,
        String eventType,
        Instant occurredAt,
        Long documentId,
        String title,
        String fileName,
        String fileKey,
        String contentType,
        Long fileSize,
        String storageBucket
) {
}
