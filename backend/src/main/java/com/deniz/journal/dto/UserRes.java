package com.deniz.journal.dto;

import com.deniz.journal.entity.User;

public record UserRes(Long id, String email, String displayName) {

    public static UserRes from(User u) {
        return new UserRes(u.getId(), u.getEmail(), u.getDisplayName());
    }
}