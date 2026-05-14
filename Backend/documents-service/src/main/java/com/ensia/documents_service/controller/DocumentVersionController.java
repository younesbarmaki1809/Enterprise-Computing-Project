package com.ensia.documents_service.controller;

import com.ensia.documents_service.controller.dto.DocumentVersionRequest;
import com.ensia.documents_service.controller.dto.DocumentVersionResponse;
import com.ensia.documents_service.model.DocumentVersion;
import com.ensia.documents_service.repository.DocumentRepository;
import com.ensia.documents_service.repository.DocumentVersionRepository;
import com.ensia.documents_service.service.S3Service;
import com.ensia.documents_service.service.dto.PresignedUrlResponse;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/versions")
public class DocumentVersionController {

    private final DocumentVersionRepository versionRepository;
    private final DocumentRepository documentRepository;
    private final S3Service s3Service;

    public DocumentVersionController(DocumentVersionRepository versionRepository,
                                     DocumentRepository documentRepository,
                                     @org.springframework.beans.factory.annotation.Autowired(required = false) S3Service s3Service) {
        this.versionRepository = versionRepository;
        this.documentRepository = documentRepository;
        this.s3Service = s3Service;
    }

    @GetMapping
    public List<DocumentVersionResponse> listVersions(@RequestParam("documentId") Long documentId) {
        return versionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public DocumentVersionResponse createVersion(@RequestBody DocumentVersionRequest request) {
        if (request.getDocumentId() == null) {
            throw new IllegalArgumentException("documentId is required");
        }

        if (!documentRepository.existsById(request.getDocumentId())) {
            throw new NoSuchElementException("Document not found with id: " + request.getDocumentId());
        }

        DocumentVersion version = new DocumentVersion();
        version.setDocumentId(request.getDocumentId());
        version.setVersionNumber(request.getVersionNumber());
        version.setFileName(request.getFileName());
        version.setFileKey(request.getFileKey());
        version.setContentType(request.getContentType());
        version.setFileSize(request.getFileSize());
        version.setUploadedBy(request.getUploadedBy());
        version.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : Instant.now());
        version.setChangelog(request.getChangelog());

        DocumentVersion saved = versionRepository.save(version);
        return toResponse(saved);
    }

    private DocumentVersionResponse toResponse(DocumentVersion version) {
        DocumentVersionResponse response = new DocumentVersionResponse();
        response.setId(version.getId());
        response.setDocumentId(version.getDocumentId());
        response.setVersionNumber(version.getVersionNumber());
        response.setFileName(version.getFileName());
        response.setFileKey(version.getFileKey());
        response.setContentType(version.getContentType());
        response.setFileSize(version.getFileSize());
        response.setUploadedBy(version.getUploadedBy());
        response.setCreatedAt(version.getCreatedAt());
        response.setChangelog(version.getChangelog());

        if (version.getFileKey() != null && s3Service != null) {
            PresignedUrlResponse presigned = s3Service.createPresignedDownload(version.getFileKey());
            response.setDownloadUrl(presigned.url());
        }

        return response;
    }
}
