package com.ensia.documents_service.service;

import com.ensia.documents_service.model.DocumentTranslation;
import com.ensia.documents_service.repository.DocumentTranslationRepository;
import com.ensia.documents_service.service.event.DocumentTranslatedEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonPrimitive;
import java.time.Instant;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class DocumentTranslationConsumer {

    private final DocumentTranslationRepository repository;
    private final Gson gson = new GsonBuilder()
            .registerTypeAdapter(Instant.class, (com.google.gson.JsonDeserializer<Instant>)
                    (value, type, context) -> Instant.parse(value.getAsString()))
            .registerTypeAdapter(Instant.class, (com.google.gson.JsonSerializer<Instant>)
                    (value, type, context) -> new JsonPrimitive(value.toString()))
            .create();

    public DocumentTranslationConsumer(DocumentTranslationRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = "${dms.kafka.topics.documents-translated}")
    public void handleTranslatedEvent(String payload) {
        DocumentTranslatedEvent event = gson.fromJson(payload, DocumentTranslatedEvent.class);

        if (event == null || event.eventId() == null || event.documentId() == null) {
            return;
        }

        if (repository.findByEventId(event.eventId()).isPresent()) {
            return;
        }

        DocumentTranslation translation = new DocumentTranslation();
        translation.setEventId(event.eventId());
        translation.setDocumentId(event.documentId());
        translation.setSourceLanguage(event.sourceLanguage());
        translation.setTargetLanguage(event.targetLanguage());
        translation.setSourceText(event.sourceText());
        translation.setTranslatedText(event.translatedText());
        translation.setModel(event.model());
        translation.setCreatedAt(event.occurredAt() != null ? event.occurredAt() : Instant.now());

        repository.save(translation);
    }
}
