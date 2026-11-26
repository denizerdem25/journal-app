package com.deniz.journal.dto;

import com.deniz.journal.entity.JournalEntry;

import java.time.LocalDateTime;
import java.util.List;

public record JournalEntryRes(
        Long id,
        String title,
        String content,
        String mood,
        Double latitude,
        Double longitude,
        String locationName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<MediaFileRes> media
) {
    public static JournalEntryRes from(JournalEntry e) {
        return new JournalEntryRes(
                e.getId(), e.getTitle(), e.getContent(), e.getMood(),
                e.getLatitude(), e.getLongitude(), e.getLocationName(),
                e.getCreatedAt(), e.getUpdatedAt(),
                e.getMedia().stream().map(MediaFileRes::from).toList()
        );
    }
}