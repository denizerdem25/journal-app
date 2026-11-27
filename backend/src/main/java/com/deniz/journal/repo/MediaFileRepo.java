package com.deniz.journal.repo;

import com.deniz.journal.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MediaFileRepo extends JpaRepository<MediaFile, Long> {

    // Medya, bu kullanıcıya ait bir günlüğün medyası olmalı
    Optional<MediaFile> findByIdAndEntryUserId(Long id, Long userId);
}