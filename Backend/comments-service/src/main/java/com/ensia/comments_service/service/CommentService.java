package com.ensia.comments_service.service;

import com.ensia.comments_service.model.Comment;
import com.ensia.comments_service.model.CommentKey;
import com.ensia.comments_service.model.CommentRequest;
import com.ensia.comments_service.model.CommentResponse;
import com.ensia.comments_service.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CommentService {

    private final CommentRepository repository;

    public CommentService(CommentRepository repository) {
        this.repository = repository;
    }

    public List<CommentResponse> getComments(Long docId) {
        return repository.findByDocId(docId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse addComment(CommentRequest request) {
        CommentKey key = new CommentKey();
        key.setDocId(request.getDocumentId());
        key.setCommentId(timeUuid());

        Comment comment = new Comment();
        comment.setKey(key);
        comment.setUserId(request.getUserId());
        comment.setText(request.getText());
        comment.setCreatedAt(request.getCreatedAt() != null ? request.getCreatedAt() : Instant.now());

        return toResponse(repository.save(comment));
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getKey().getCommentId().toString());
        response.setDocumentId(comment.getKey().getDocId());
        response.setUserId(comment.getUserId());
        response.setText(comment.getText());
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }

    private UUID timeUuid() {
        return com.datastax.oss.driver.api.core.uuid.Uuids.timeBased();
    }
}