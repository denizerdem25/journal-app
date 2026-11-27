package com.deniz.journal.controller;

import com.deniz.journal.dto.AuthRes;
import com.deniz.journal.dto.LoginReq;
import com.deniz.journal.dto.RegisterReq;
import com.deniz.journal.dto.UserRes;
import com.deniz.journal.security.CurrentUser;
import com.deniz.journal.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthRes register(@Valid @RequestBody RegisterReq request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthRes login(@Valid @RequestBody LoginReq request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserRes me(@AuthenticationPrincipal Jwt jwt) {
        return authService.me(CurrentUser.idOf(jwt));
    }
}