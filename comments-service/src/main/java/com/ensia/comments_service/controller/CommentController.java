package com.ensia.comments_service.controller;

import com.ensia.comments_service.model.CommentRequest;
import com.ensia.comments_service.model.CommentResponse;
import com.ensia.comments_service.service.CommentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/list/{docId}")
    public List<CommentResponse> getComments(@PathVariable Long docId) {
        return commentService.getComments(docId);
    }

    @PostMapping("/add")
    public CommentResponse addComment(@RequestBody CommentRequest comment) {
        return commentService.addComment(comment);
    }
}
