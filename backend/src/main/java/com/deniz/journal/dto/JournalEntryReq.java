package com.deniz.journal.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JournalEntryReq(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title can be at most 150 characters")
        String title,

        String content,

        String mood,

        @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
        Double longitude,

        @Size(max = 150, message = "Location name can be at most 150 characters")
        String locationName
) {
        /** Enlem ve boylam ya birlikte gelmeli ya da hiç gelmemeli */
        @AssertTrue(message = "Latitude and longitude must be given together")
        public boolean isLocationComplete() {
                return (latitude == null) == (longitude == null);
        }
}