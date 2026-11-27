package com.deniz.journal.repo;

import com.deniz.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JournalEntryRepo extends JpaRepository<JournalEntry, Long> {

    // Sadece bu kullanıcının günlükleri, en yeni en üstte
    List<JournalEntry> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // Günlük hem bu id'ye sahip hem de bu kullanıcıya ait olmalı
    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}