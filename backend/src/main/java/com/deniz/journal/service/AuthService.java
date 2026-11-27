package com.deniz.journal.service;

import com.deniz.journal.dto.AuthRes;
import com.deniz.journal.dto.LoginReq;
import com.deniz.journal.dto.RegisterReq;
import com.deniz.journal.dto.UserRes;
import com.deniz.journal.entity.User;
import com.deniz.journal.exception.EmailAlreadyUsedException;
import com.deniz.journal.exception.InvalidCredentialsException;
import com.deniz.journal.repo.UserRepo;
import com.deniz.journal.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional
    public AuthRes register(RegisterReq request) {
        String email = normalizeEmail(request.email());

        if (userRepo.existsByEmail(email)) {
            throw new EmailAlreadyUsedException();
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName().trim());
        userRepo.save(user);

        return new AuthRes(tokenService.generateToken(user), UserRes.from(user));
    }

    @Transactional(readOnly = true)
    public AuthRes login(LoginReq request) {
        User user = userRepo.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        return new AuthRes(tokenService.generateToken(user), UserRes.from(user));
    }

    @Transactional(readOnly = true)
    public UserRes me(Long userId) {
        return userRepo.findById(userId)
                .map(UserRes::from)
                .orElseThrow(InvalidCredentialsException::new);
    }

    /** " Deniz@Mail.com " → "deniz@mail.com" */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}