package com.deniz.journal.service;

import com.deniz.journal.dto.JournalEntryReq;
import com.deniz.journal.dto.JournalEntryRes;
import com.deniz.journal.entity.JournalEntry;
import com.deniz.journal.exception.EntryNotFoundException;
import com.deniz.journal.repo.JournalEntryRepo;
import com.deniz.journal.repo.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JournalEntryService {

    private final JournalEntryRepo repository;
    private final UserRepo userRepo;
    private final FileStorageService fileStorage;

    @Transactional(readOnly = true)
    public List<JournalEntryRes> getAll(Long userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(JournalEntryRes::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public JournalEntryRes getById(Long id, Long userId) {
        return JournalEntryRes.from(findOwnedEntry(id, userId));
    }

    @Transactional
    public JournalEntryRes create(JournalEntryReq request, Long userId) {
        JournalEntry entry = new JournalEntry();
        entry.setUser(userRepo.getReferenceById(userId));
        applyRequest(entry, request);
        return JournalEntryRes.from(repository.save(entry));
    }

    @Transactional
    public JournalEntryRes update(Long id, JournalEntryReq request, Long userId) {
        JournalEntry entry = findOwnedEntry(id, userId);
        applyRequest(entry, request);
        return JournalEntryRes.from(repository.save(entry));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        JournalEntry entry = findOwnedEntry(id, userId);
        entry.getMedia().forEach(m -> fileStorage.delete(m.getStoredFileName()));
        repository.delete(entry);
    }

    /** Günlük yoksa VEYA başka kullanıcıya aitse 404 */
    private JournalEntry findOwnedEntry(Long id, Long userId) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new EntryNotFoundException(id));
    }

    private void applyRequest(JournalEntry entry, JournalEntryReq request) {
        entry.setTitle(request.title());
        entry.setContent(request.content());
        entry.setMood(request.mood());
        entry.setLatitude(request.latitude());
        entry.setLongitude(request.longitude());
        entry.setLocationName(blankToNull(request.locationName()));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}