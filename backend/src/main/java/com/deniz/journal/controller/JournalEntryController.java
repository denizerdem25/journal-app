package com.deniz.journal.controller;


import com.deniz.journal.dto.JournalEntryReq;
import com.deniz.journal.dto.JournalEntryRes;
import com.deniz.journal.service.JournalEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalEntryService service;

    @GetMapping
    public List<JournalEntryRes> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public JournalEntryRes getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JournalEntryRes create(@Valid @RequestBody JournalEntryReq request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public JournalEntryRes update(@PathVariable Long id,
                                  @Valid @RequestBody JournalEntryReq request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}