package com.ensia.comments_service.model;

import org.springframework.data.cassandra.core.cql.PrimaryKeyType;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyClass;
import org.springframework.data.cassandra.core.mapping.PrimaryKeyColumn;

import java.io.Serializable;
import java.util.UUID;

@PrimaryKeyClass
public class CommentKey implements Serializable {

    @PrimaryKeyColumn(name = "doc_id", type = PrimaryKeyType.PARTITIONED, ordinal = 0)
    private Long docId;

    @PrimaryKeyColumn(name = "comment_id", type = PrimaryKeyType.CLUSTERED, ordinal = 1)
    private UUID commentId;

    public Long getDocId() {
        return docId;
    }

    public void setDocId(Long docId) {
        this.docId = docId;
    }

    public UUID getCommentId() {
        return commentId;
    }

    public void setCommentId(UUID commentId) {
        this.commentId = commentId;
    }
}