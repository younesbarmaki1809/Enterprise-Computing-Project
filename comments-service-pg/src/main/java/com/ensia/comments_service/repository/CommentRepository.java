package com.ensia.comments_service.repository;

import com.ensia.comments_service.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByDocId(Long docId);
}
