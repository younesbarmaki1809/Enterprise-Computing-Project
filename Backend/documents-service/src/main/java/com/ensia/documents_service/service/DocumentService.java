package com.ensia.documents_service.service;

import com.ensia.documents_service.model.Document;
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
    private final S3Service s3Service;
    private final DocumentEventPublisher documentEventPublisher;

    public DocumentService(DocumentRepository documentRepository,
                           @Autowired(required = false) S3Service s3Service,
                           DocumentEventPublisher documentEventPublisher) {
        this.documentRepository = documentRepository;
        this.s3Service = s3Service;
        this.documentEventPublisher = documentEventPublisher;
    }

    public List<Document> listDocuments() {
        return documentRepository.findAll();
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