package com.deniz.journal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class EmailAlreadyUsedException extends RuntimeException {
    public EmailAlreadyUsedException() {
        super("This email is already registered");
    }
}