package com.deniz.journal.service;

import com.deniz.journal.dto.JournalEntryReq;
import com.deniz.journal.dto.JournalEntryRes;
import com.deniz.journal.entity.JournalEntry;
import com.deniz.journal.exception.EntryNotFoundException;
import com.deniz.journal.repo.JournalEntryRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JournalEntryService {

    private final JournalEntryRepo repository;
    private final FileStorageService fileStorage;

    @Transactional(readOnly = true)
    public List<JournalEntryRes> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(JournalEntryRes::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryRes getById(Long id) {
        return JournalEntryRes.from(findEntity(id));
    }

    @Transactional
    public JournalEntryRes create(JournalEntryReq request) {
        JournalEntry entry = new JournalEntry();
        applyRequest(entry, request);
        return JournalEntryRes.from(repository.save(entry));
    }

    @Transactional
    public JournalEntryRes update(Long id, JournalEntryReq request) {
        JournalEntry entry = findEntity(id);
        applyRequest(entry, request);
        return JournalEntryRes.from(repository.save(entry));
    }

    @Transactional
    public void delete(Long id) {
        JournalEntry entry = findEntity(id);
        // Diskteki dosyaları sil; veritabanı kayıtlarını cascade siler
        entry.getMedia().forEach(m -> fileStorage.delete(m.getStoredFileName()));
        repository.delete(entry);
    }

    private JournalEntry findEntity(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntryNotFoundException(id));
    }

    private void applyRequest(JournalEntry entry, JournalEntryReq request) {
        entry.setTitle(request.title());
        entry.setContent(request.content());
        entry.setMood(request.mood());
    }
}