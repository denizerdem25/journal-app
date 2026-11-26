package com.deniz.journal.repo;

import com.deniz.journal.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalEntryRepo extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findAllByOrderByCreatedAtDesc(); // en yeni en üstte
}
