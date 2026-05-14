package com.ensia.documents_service.service;

import com.ensia.documents_service.model.Document;
import com.ensia.documents_service.service.event.DocumentUploadedEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonPrimitive;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
public class DocumentEventPublisher {

    private final KafkaTemplate<Object, Object> kafkaTemplate;
    private final String topicName;
    private final String storageBucket;
    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(Instant.class, (com.google.gson.JsonSerializer<Instant>)
                    (value, type, context) -> new JsonPrimitive(value.toString()))
            .create();

    public DocumentEventPublisher(
            KafkaTemplate<Object, Object> kafkaTemplate,
            @Value("${dms.kafka.topics.documents-uploaded}") String topicName,
            @Value("${aws.s3.bucket}") String storageBucket) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicName = topicName;
        this.storageBucket = storageBucket;
    }

    public void publishDocumentUploaded(Document document) {
        DocumentUploadedEvent event = new DocumentUploadedEvent(
                UUID.randomUUID().toString(),
                "DocumentUploaded",
                Instant.now(),
                document.getId(),
                document.getTitle(),
                document.getFileName(),
                document.getFileKey(),
                document.getContentType(),
                document.getFileSize(),
                storageBucket
        );

        String messageKey = String.valueOf(document.getId());
        String payload = gson.toJson(event);

        try {
            kafkaTemplate.send(topicName, messageKey, payload).get(5, TimeUnit.SECONDS);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while publishing DocumentUploaded event", ex);
        } catch (ExecutionException | TimeoutException ex) {
            throw new IllegalStateException("Failed to publish DocumentUploaded event", ex);
        }
    }
}
