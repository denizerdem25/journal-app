package com.deniz.journal.security;

import org.springframework.security.oauth2.jwt.Jwt;

/** Doğrulanmış token'dan kullanıcı id'sini okur */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static Long idOf(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }
}