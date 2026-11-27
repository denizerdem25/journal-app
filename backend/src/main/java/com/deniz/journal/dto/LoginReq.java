package com.deniz.journal.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginReq(
        @NotBlank(message = "Email is required")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {}