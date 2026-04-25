package com.societycms.controller;

import com.societycms.dto.*;
import com.societycms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register-society")
    public ResponseEntity<ApiResponse<AuthResponse>> registerSociety(@Valid @RequestBody RegisterSocietyRequest request) {
        AuthResponse response = authService.registerSociety(request);
        return ResponseEntity.ok(ApiResponse.success("Society registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<String>> verifyEmail(@RequestParam String token) {
        String result = authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success(result, null));
    }
}
