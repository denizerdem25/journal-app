package com.deniz.journal.service;

import com.deniz.journal.dto.MediaFileRes;
import com.deniz.journal.entity.JournalEntry;
import com.deniz.journal.entity.MediaFile;
import com.deniz.journal.entity.MediaFileType;
import com.deniz.journal.exception.EntryNotFoundException;
import com.deniz.journal.exception.InvalidFileException;
import com.deniz.journal.exception.MediaNotFoundException;
import com.deniz.journal.repo.JournalEntryRepo;
import com.deniz.journal.repo.MediaFileRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaFileRepo mediaRepository;
    private final JournalEntryRepo entryRepository;
    private final FileStorageService fileStorage;

    @Transactional
    public MediaFileRes upload(Long entryId, Long userId, MultipartFile file, MediaFileType type) {
        JournalEntry entry = entryRepository.findByIdAndUserId(entryId, userId)
                .orElseThrow(() -> new EntryNotFoundException(entryId));

        validate(file, type);

        String storedName = fileStorage.store(file);

        MediaFile media = new MediaFile();
        media.setEntry(entry);
        media.setType(type);
        media.setStoredFileName(storedName);
        media.setOriginalFileName(file.getOriginalFilename());
        media.setContentType(file.getContentType());
        media.setSize(file.getSize());

        return MediaFileRes.from(mediaRepository.save(media));
    }

    @Transactional(readOnly = true)
    public MediaFile getMedia(Long id, Long userId) {
        return mediaRepository.findByIdAndEntryUserId(id, userId)
                .orElseThrow(() -> new MediaNotFoundException(id));
    }

    public Resource loadFile(MediaFile media) {
        Resource resource = fileStorage.load(media.getStoredFileName());
        if (!resource.exists()) {
            throw new MediaNotFoundException(media.getId());
        }
        return resource;
    }

    @Transactional
    public void delete(Long id, Long userId) {
        MediaFile media = getMedia(id, userId);
        media.getEntry().getMedia().remove(media);
        fileStorage.delete(media.getStoredFileName());
    }

    private void validate(MultipartFile file, MediaFileType type) {
        if (file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith(type.getMimePrefix())) {
            throw new InvalidFileException(
                    "File type " + contentType + " is not allowed for " + type);
        }
    }
}