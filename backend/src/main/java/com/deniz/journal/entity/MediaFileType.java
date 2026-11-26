package com.deniz.journal.entity;

public enum MediaFileType {
    PHOTO("image/"),
    AUDIO("audio/"),
    VIDEO("video/");

    // Bu türe ait dosyaların içerik tipi bununla başlamalı (örn: "image/jpeg")
    private final String mimePrefix;

    MediaFileType(String mimePrefix) {
        this.mimePrefix = mimePrefix;
    }

    public String getMimePrefix() {
        return mimePrefix;
    }
}
