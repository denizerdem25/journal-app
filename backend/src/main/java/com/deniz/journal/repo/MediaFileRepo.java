package com.deniz.journal.repo;

import com.deniz.journal.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaFileRepo extends JpaRepository<MediaFile, Long> {
}