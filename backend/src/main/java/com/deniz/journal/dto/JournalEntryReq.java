package com.deniz.journal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalEntryReq(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title can be at most 150 characters")
        String title,
        String content,
        String mood
) {

}
