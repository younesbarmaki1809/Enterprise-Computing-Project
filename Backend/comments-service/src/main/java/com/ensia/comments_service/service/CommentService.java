package com.ensia.comments_service.service;

import com.ensia.comments_service.model.Comment;
import com.ensia.comments_service.model.CommentKey;
import com.ensia.comments_service.model.CommentRequest;
import com.ensia.comments_service.model.CommentResponse;
import com.ensia.comments_service.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
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
        UUID partitionKey = toPartitionKey(docId);
        return repository.findByDocId(partitionKey).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse addComment(CommentRequest request) {
        UUID partitionKey = toPartitionKey(request.getDocId());

        CommentKey key = new CommentKey();
        key.setDocId(partitionKey);
        key.setCommentId(timeUuid());

        Comment comment = new Comment();
        comment.setKey(key);
        comment.setContent(request.getContent());
        comment.setAuthor(request.getAuthor());

        return toResponse(repository.save(comment));
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setDocId(comment.getKey().getDocId());
        response.setCommentId(comment.getKey().getCommentId());
        response.setContent(comment.getContent());
        response.setAuthor(comment.getAuthor());
        return response;
    }

    private UUID toPartitionKey(Long docId) {
        return UUID.nameUUIDFromBytes(("doc-" + docId).getBytes(StandardCharsets.UTF_8));
    }

    private UUID timeUuid() {
        return com.datastax.oss.driver.api.core.uuid.Uuids.timeBased();
    }
}