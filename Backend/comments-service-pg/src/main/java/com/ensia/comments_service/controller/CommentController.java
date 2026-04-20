package com.ensia.comments_service.controller;

import com.ensia.comments_service.model.Comment;
import com.ensia.comments_service.repository.CommentRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentRepository repository;

    public CommentController(CommentRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/list/{docId}")
    public List<Comment> getComments(@PathVariable Long docId) {
        return repository.findByDocId(docId);
    }

    @PostMapping("/add")
    public Comment addComment(@RequestBody Comment comment) {
        return repository.save(comment);
    }
}
