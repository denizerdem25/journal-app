package com.deniz.journal.controller;

import com.deniz.journal.dto.JournalEntryReq;
import com.deniz.journal.dto.JournalEntryRes;
import com.deniz.journal.security.CurrentUser;
import com.deniz.journal.service.JournalEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalEntryService service;

    @GetMapping
    public List<JournalEntryRes> getAll(@AuthenticationPrincipal Jwt jwt) {
        return service.getAll(CurrentUser.idOf(jwt));
    }

    @GetMapping("/{id}")
    public JournalEntryRes getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return service.getById(id, CurrentUser.idOf(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JournalEntryRes create(@Valid @RequestBody JournalEntryReq request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return service.create(request, CurrentUser.idOf(jwt));
    }

    @PutMapping("/{id}")
    public JournalEntryRes update(@PathVariable Long id,
                                  @Valid @RequestBody JournalEntryReq request,
                                  @AuthenticationPrincipal Jwt jwt) {
        return service.update(id, request, CurrentUser.idOf(jwt));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        service.delete(id, CurrentUser.idOf(jwt));
    }
}