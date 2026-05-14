package com.ensia.documents_service.repository;

import com.ensia.documents_service.model.DocumentTranslation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentTranslationRepository extends JpaRepository<DocumentTranslation, Long> {

    Optional<DocumentTranslation> findByEventId(String eventId);
}
