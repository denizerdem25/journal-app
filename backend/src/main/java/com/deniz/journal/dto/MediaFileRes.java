package com.deniz.journal.dto;

import com.deniz.journal.entity.MediaFile;
import com.deniz.journal.entity.MediaFileType;

import java.time.LocalDateTime;

public record MediaFileRes(
        Long id,
        MediaFileType type,
        String contentType,
        LocalDateTime createdAt
) {
    public static MediaFileRes from(MediaFile m) {
        return new MediaFileRes(m.getId(), m.getType(), m.getContentType(), m.getCreatedAt());
    }
}