package com.deniz.journal.controller;

import com.deniz.journal.dto.MediaFileRes;
import com.deniz.journal.entity.MediaFile;
import com.deniz.journal.entity.MediaFileType;
import com.deniz.journal.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    // Günlüğe dosya yükle: POST /api/entries/5/media  (form-data: file, type)
    @PostMapping(value = "/entries/{entryId}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MediaFileRes upload(@PathVariable Long entryId,
                               @RequestParam("file") MultipartFile file,
                               @RequestParam("type") MediaFileType type) {
        return mediaService.upload(entryId, file, type);
    }

    // Dosyanın kendisini getir: GET /api/media/3/file  → resim/ses/video
    @GetMapping("/media/{id}/file")
    public ResponseEntity<Resource> getFile(@PathVariable Long id) {
        MediaFile media = mediaService.getMedia(id);
        Resource resource = mediaService.loadFile(media);

        return ResponseEntity.ok()
                .contentType(toMediaType(media.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)))
                .body(resource);
    }

    // Medyayı sil: DELETE /api/media/3
    @DeleteMapping("/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        mediaService.delete(id);
    }

    /**
     * "video/webm;codecs=vp9,opus" gibi parametreli türlerden yalnızca
     * "video/webm" kısmını alır. Okunamayan türlerde genel ikili dosya döner.
     */
    private MediaType toMediaType(String contentType) {
        try {
            String baseType = contentType.split(";")[0].trim();
            return MediaType.parseMediaType(baseType);
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}