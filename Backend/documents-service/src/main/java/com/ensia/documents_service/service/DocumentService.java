package com.ensia.documents_service.service;

import com.ensia.documents_service.model.Department;
import com.ensia.documents_service.model.Document;
import com.ensia.documents_service.repository.DepartmentRepository;
import com.ensia.documents_service.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DepartmentRepository departmentRepository;
    private final S3Service s3Service;
    private final DocumentEventPublisher documentEventPublisher;

    public DocumentService(DocumentRepository documentRepository,
                           DepartmentRepository departmentRepository,
                           @Autowired(required = false) S3Service s3Service,
                           DocumentEventPublisher documentEventPublisher) {
        this.documentRepository = documentRepository;
        this.departmentRepository = departmentRepository;
        this.s3Service = s3Service;
        this.documentEventPublisher = documentEventPublisher;
    }

    public List<Document> listDocuments() {
        return documentRepository.findAll();
    }

    /**
     * Return only documents from departments that the given user belongs to.
     * If the user belongs to no departments, returns an empty list.
     */
    public List<Document> listDocumentsForUser(Long userId) {
        List<Long> departmentIds = getUserDepartmentIds(userId);
        if (departmentIds.isEmpty()) {
            return List.of();
        }
        return documentRepository.findByDepartmentIdIn(departmentIds);
    }

    /**
     * Check whether a user is allowed to access a specific document.
     * Returns true if the document's department includes the user,
     * or if the document has no department assigned.
     */
    public boolean canUserAccessDocument(Long userId, Document document) {
        if (document.getDepartmentId() == null) {
            return true; // documents without a department are accessible to all authenticated users
        }
        List<Long> departmentIds = getUserDepartmentIds(userId);
        return departmentIds.contains(document.getDepartmentId());
    }

    /**
     * Get all department IDs a user belongs to.
     */
    public List<Long> getUserDepartmentIds(Long userId) {
        return departmentRepository.findByMemberIdsContaining(userId)
                .stream()
                .map(Department::getId)
                .toList();
    }

    @Cacheable(value = "documents", key = "#id")
    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));
    }

    public Document addDocument(Document document) {
        ensureTimestamps(document);
        Document savedDocument = documentRepository.save(document);
        documentEventPublisher.publishDocumentUploaded(savedDocument);
        return savedDocument;
    }

    public Document save(Document document) {
        ensureTimestamps(document);
        return documentRepository.save(document);
    }

    public Document uploadDocument(String title, MultipartFile file) throws IOException {
        ensureS3Available();

        String fileKey = s3Service.uploadFile(file);

        Document document = new Document();
        document.setTitle(title);
        document.setFileName(file.getOriginalFilename());
        document.setFileKey(fileKey);
        document.setContentType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setCreatedAt(Instant.now());
        document.setUpdatedAt(Instant.now());

        Document savedDocument = documentRepository.save(document);
        documentEventPublisher.publishDocumentUploaded(savedDocument);
        return savedDocument;
    }

    @CacheEvict(value = "documents", key = "#id")
    public Document uploadFileToDocument(Long id, MultipartFile file) throws IOException {
        ensureS3Available();

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        if (document.getFileKey() != null) {
            s3Service.deleteFile(document.getFileKey());
        }

        String fileKey = s3Service.uploadFile(file);
        document.setFileName(file.getOriginalFilename());
        document.setFileKey(fileKey);
        document.setContentType(file.getContentType());
        document.setFileSize(file.getSize());
        document.setUpdatedAt(Instant.now());

        return documentRepository.save(document);
    }

    public byte[] downloadDocumentFile(Long id) throws IOException {
        ensureS3Available();

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        if (document.getFileKey() == null) {
            throw new NoSuchElementException("Document file not found with id: " + id);
        }

        return s3Service.downloadFile(document.getFileKey());
    }

    @CacheEvict(value = "documents", key = "#id")
    public void deleteDocument(Long id) {
        if (!documentRepository.existsById(id)) {
            throw new NoSuchElementException("Document not found with id: " + id);
        }

        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));

        if (document.getFileKey() != null && s3Service != null) {
            s3Service.deleteFile(document.getFileKey());
        }

        documentRepository.deleteById(id);
    }

    private void ensureS3Available() {
        if (s3Service == null) {
            throw new IllegalStateException("S3 service is not configured");
        }
    }

    private void ensureTimestamps(Document document) {
        if (document.getCreatedAt() == null) {
            document.setCreatedAt(Instant.now());
        }

        if (document.getUpdatedAt() == null) {
            document.setUpdatedAt(document.getCreatedAt());
        }
    }
}