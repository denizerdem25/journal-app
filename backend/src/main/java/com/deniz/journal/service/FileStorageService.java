package com.deniz.journal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path rootDir;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDir) {
        this.rootDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootDir); // klasör yoksa oluştur
        } catch (IOException e) {
            throw new UncheckedIOException("Upload folder could not be created: " + rootDir, e);
        }
    }

    /** Dosyayı benzersiz bir adla kaydeder ve bu adı döndürür. */
    public String store(MultipartFile file) {
        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + (extension != null ? "." + extension.toLowerCase() : "");

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, rootDir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("File could not be saved", e);
        }
        return storedName;
    }

    /** Diskteki dosyayı okunabilir bir kaynak olarak döndürür. */
    public Resource load(String storedName) {
        return new FileSystemResource(rootDir.resolve(storedName).normalize());
    }

    /** Dosyayı diskten siler (yoksa sessizce geçer). */
    public void delete(String storedName) {
        try {
            Files.deleteIfExists(rootDir.resolve(storedName).normalize());
        } catch (IOException e) {
            // Dosya silinemese bile uygulama çalışmaya devam etsin
            System.err.println("File could not be deleted: " + storedName);
        }
    }
}