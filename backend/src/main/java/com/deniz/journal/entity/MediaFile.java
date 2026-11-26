package com.deniz.journal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_files")
@Getter
@Setter
@NoArgsConstructor
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Çok medya → bir günlük. Veritabanında entry_id sütunu olarak tutulur.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    private JournalEntry entry;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MediaFileType type;

    // Diskteki benzersiz adı (örn: 3f2a9c...e1.jpg)
    @Column(nullable = false, unique = true)
    private String storedFileName;

    // Kullanıcının yüklediği dosyanın orijinal adı (örn: IMG_2041.jpg)
    private String originalFileName;

    @Column(nullable = false)
    private String contentType; // örn: image/jpeg

    private Long size; // byte cinsinden

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}