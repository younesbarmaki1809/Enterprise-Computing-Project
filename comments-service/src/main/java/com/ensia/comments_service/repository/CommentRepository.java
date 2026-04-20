package com.ensia.comments_service.repository;

import com.ensia.comments_service.model.Comment;
import com.ensia.comments_service.model.CommentKey;
import org.springframework.data.cassandra.repository.CassandraRepository;
import org.springframework.data.cassandra.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends CassandraRepository<Comment, CommentKey> {

    @Query("SELECT * FROM comments WHERE doc_id = ?0")
    List<Comment> findByDocId(UUID docId);
}
