package com.ensia.documents_service.controller;

import com.ensia.documents_service.controller.dto.PresignDownloadRequest;
import com.ensia.documents_service.controller.dto.PresignUploadRequest;
import com.ensia.documents_service.model.Document;
import com.ensia.documents_service.service.DocumentService;
import com.ensia.documents_service.service.S3Service;
import com.ensia.documents_service.service.dto.PresignedUrlResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final RestClient restClient;
    private final String commentsServiceUrl;
    private final S3Service s3Service;

    public DocumentController(DocumentService documentService,
                              @Value("${comments.service.url:http://localhost:8083}") String commentsServiceUrl,
                              @org.springframework.beans.factory.annotation.Autowired(required = false) S3Service s3Service) {
        this.documentService = documentService;
        this.commentsServiceUrl = commentsServiceUrl;
        this.restClient = RestClient.create();
        this.s3Service = s3Service;
    }

    @GetMapping
    public ResponseEntity<List<Document>> listDocuments(
            @RequestParam(name = "title_like", required = false) String titleLike,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "departmentId", required = false) Long departmentId,
            @RequestParam(name = "_page", required = false) Integer page,
            @RequestParam(name = "_per_page", required = false) Integer perPage) {
        List<Document> documents = new ArrayList<>(documentService.listDocuments());

        if (titleLike != null && !titleLike.isBlank()) {
            String needle = titleLike.trim().toLowerCase();
            documents = documents.stream()
                    .filter(document -> document.getTitle() != null
                            && document.getTitle().toLowerCase().contains(needle))
                    .toList();
        }

        if (categoryId != null) {
            documents = documents.stream()
                    .filter(document -> categoryId.equals(document.getCategoryId()))
                    .toList();
        }

        if (departmentId != null) {
            documents = documents.stream()
                    .filter(document -> departmentId.equals(document.getDepartmentId()))
                    .toList();
        }

        int total = documents.size();
        if (page != null && perPage != null && perPage > 0) {
            int fromIndex = Math.min(Math.max(page - 1, 0) * perPage, total);
            int toIndex = Math.min(fromIndex + perPage, total);
            documents = documents.subList(fromIndex, toIndex);
        }

        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total))
                .body(documents);
    }

    @GetMapping("/{id}")
    public Document getDocumentById(@PathVariable Long id) {
        return documentService.getDocumentById(id);
    }

    @PostMapping
    public Document createDocument(@RequestBody Document document) {
        if (document.getTags() == null) {
            document.setTags(new ArrayList<>());
        }
        if (document.getUpdatedAt() == null) {
            document.setUpdatedAt(document.getCreatedAt() != null
                    ? document.getCreatedAt()
                    : Instant.now());
        }
        return documentService.addDocument(document);
    }

    @PatchMapping("/{id}")
    public Document patchDocument(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Document document = documentService.getDocumentById(id);

        if (payload.containsKey("title")) {
            document.setTitle((String) payload.get("title"));
        }
        if (payload.containsKey("categoryId")) {
            document.setCategoryId(asLong(payload.get("categoryId")));
        }
        if (payload.containsKey("departmentId")) {
            document.setDepartmentId(asLong(payload.get("departmentId")));
        }
        if (payload.containsKey("ownerId")) {
            document.setOwnerId(asLong(payload.get("ownerId")));
        }
        if (payload.containsKey("currentVersionId")) {
            document.setCurrentVersionId(asLong(payload.get("currentVersionId")));
        }
        if (payload.containsKey("fileKey")) {
            document.setFileKey((String) payload.get("fileKey"));
        }
        if (payload.containsKey("fileName")) {
            document.setFileName((String) payload.get("fileName"));
        }
        if (payload.containsKey("contentType")) {
            document.setContentType((String) payload.get("contentType"));
        }
        if (payload.containsKey("fileSize")) {
            document.setFileSize(asLong(payload.get("fileSize")));
        }
        if (payload.containsKey("tags")) {
            Object tagsPayload = payload.get("tags");
            if (tagsPayload instanceof List<?> tags) {
                document.setTags(tags.stream().map(String::valueOf).toList());
            }
        }
        if (payload.containsKey("updatedAt")) {
            Object value = payload.get("updatedAt");
            if (value != null) {
                document.setUpdatedAt(Instant.parse(String.valueOf(value)));
            }
        } else {
            document.setUpdatedAt(Instant.now());
        }

        return documentService.save(document);
    }

    @PostMapping("/presign-upload")
    public PresignedUrlResponse presignUpload(@RequestBody PresignUploadRequest request) {
        ensureS3Available();
        return s3Service.createPresignedUpload(request.getFileName(), request.getContentType());
    }

    @PostMapping("/presign-download")
    public PresignedUrlResponse presignDownload(@RequestBody PresignDownloadRequest request) {
        ensureS3Available();
        return s3Service.createPresignedDownload(request.getFileKey());
    }

    @GetMapping("/{id}/download-url")
    public PresignedUrlResponse presignDownloadByDocument(@PathVariable Long id) {
        ensureS3Available();
        Document document = documentService.getDocumentById(id);

        if (document.getFileKey() == null) {
            throw new NoSuchElementException("Document file not found with id: " + id);
        }

        return s3Service.createPresignedDownload(document.getFileKey());
    }

    @GetMapping("/list")
    public List<Document> listDocuments() {
        return documentService.listDocuments();
    }

    @GetMapping("/get/{id}")
    public Document getDocument(@PathVariable Long id) {
        return documentService.getDocumentById(id);
    }

    @GetMapping("/full/{id}")
    public ResponseEntity<Map<String, Object>> getFullDocument(@PathVariable Long id) {
        Document document = documentService.getDocumentById(id);

        List<?> comments = restClient.get()
                .uri(commentsServiceUrl + "/comments/list/" + id)
                .retrieve()
                .body(new ParameterizedTypeReference<List<?>>() {});

        Map<String, Object> result = new HashMap<>();
        result.put("document", document);
        result.put("comments", comments);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/add")
    public Document addDocument(@RequestBody Document document) {
        return documentService.addDocument(document);
    }

    @PostMapping("/upload")
    public ResponseEntity<Document> uploadDocument(
            @RequestParam("title") String title,
            @RequestParam("file") MultipartFile file) throws IOException {
        Document saved = documentService.uploadDocument(title, file);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/file")
    public ResponseEntity<Document> uploadFileToDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) throws IOException {
        Document saved = documentService.uploadFileToDocument(id, file);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> downloadDocumentFile(@PathVariable Long id) throws IOException {
        Document document = documentService.getDocumentById(id);
        byte[] fileData = documentService.downloadDocumentFile(id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .body(fileData);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }

    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(NoSuchElementException.class)
    public Map<String, String> handleNotFound(NoSuchElementException ex) {
        return Map.of("error", ex.getMessage());
    }

    private void ensureS3Available() {
        if (s3Service == null) {
            throw new IllegalStateException("S3 service is not configured");
        }
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        return Long.parseLong(String.valueOf(value));
    }
}