package com.ensia.documents_service.service;

import com.ensia.documents_service.model.Document;
import com.ensia.documents_service.repository.DocumentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final S3Service s3Service;

    public DocumentService(DocumentRepository documentRepository,
                           @Autowired(required = false) S3Service s3Service) {
        this.documentRepository = documentRepository;
        this.s3Service = s3Service;
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

        return documentRepository.save(document);
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

        documentRepository.deleteById(id);
    }

    private void ensureS3Available() {
        if (s3Service == null) {
            throw new IllegalStateException("S3 service is not configured");
        }
    }
}