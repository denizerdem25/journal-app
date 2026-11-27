package com.deniz.journal.controller;

import com.deniz.journal.dto.MediaFileRes;
import com.deniz.journal.entity.MediaFile;
import com.deniz.journal.entity.MediaFileType;
import com.deniz.journal.security.CurrentUser;
import com.deniz.journal.service.MediaService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    @PostMapping(value = "/entries/{entryId}/media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MediaFileRes upload(@PathVariable Long entryId,
                               @RequestParam("file") MultipartFile file,
                               @RequestParam("type") MediaFileType type,
                               @AuthenticationPrincipal Jwt jwt) {
        return mediaService.upload(entryId, CurrentUser.idOf(jwt), file, type);
    }

    @GetMapping("/media/{id}/file")
    public ResponseEntity<Resource> getFile(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        MediaFile media = mediaService.getMedia(id, CurrentUser.idOf(jwt));
        Resource resource = mediaService.loadFile(media);

        return ResponseEntity.ok()
                .contentType(toMediaType(media.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePrivate())
                .body(resource);
    }

    @DeleteMapping("/media/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        mediaService.delete(id, CurrentUser.idOf(jwt));
    }

    private MediaType toMediaType(String contentType) {
        try {
            String baseType = contentType.split(";")[0].trim();
            return MediaType.parseMediaType(baseType);
        } catch (Exception e) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}