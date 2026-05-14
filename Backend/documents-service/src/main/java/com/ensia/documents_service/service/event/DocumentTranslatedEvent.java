package com.ensia.documents_service.service.event;

import java.time.Instant;

public record DocumentTranslatedEvent(
        String eventId,
        String eventType,
        Instant occurredAt,
        String sourceEventId,
        Long documentId,
        String sourceLanguage,
        String targetLanguage,
        String sourceText,
        String translatedText,
        String model,
        String fileName,
        String fileKey,
        String storageBucket,
        String contentType,
        Long fileSize
) {
}
