package com.ensia.documents_service.controller;

import com.ensia.documents_service.model.Document;
import com.ensia.documents_service.service.DocumentService;
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

    public DocumentController(DocumentService documentService,
                              @Value("${comments.service.url:http://localhost:8083}") String commentsServiceUrl) {
        this.documentService = documentService;
        this.commentsServiceUrl = commentsServiceUrl;
        this.restClient = RestClient.create();
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
}