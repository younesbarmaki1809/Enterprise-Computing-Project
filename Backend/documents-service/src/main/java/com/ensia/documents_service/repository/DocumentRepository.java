package com.ensia.documents_service.repository;

import com.ensia.documents_service.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    /**
     * Find documents that belong to any of the given department IDs.
     */
    List<Document> findByDepartmentIdIn(List<Long> departmentIds);
}