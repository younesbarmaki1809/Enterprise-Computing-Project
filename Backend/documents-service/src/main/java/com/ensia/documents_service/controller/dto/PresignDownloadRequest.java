package com.ensia.documents_service.controller.dto;

public class PresignDownloadRequest {

    private String fileKey;

    public String getFileKey() {
        return fileKey;
    }

    public void setFileKey(String fileKey) {
        this.fileKey = fileKey;
    }
}
