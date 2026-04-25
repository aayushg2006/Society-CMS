package com.societycms.service;

import com.societycms.config.JwtUtil;
import com.societycms.dto.AuthResponse;
import com.societycms.dto.LoginRequest;
import com.societycms.dto.RegisterRequest;
import com.societycms.dto.RegisterSocietyRequest;
import com.societycms.entity.Flat;
import com.societycms.entity.Society;
import com.societycms.entity.User;
import com.societycms.enums.UserRole;
import com.societycms.exception.BadRequestException;
import com.societycms.exception.ResourceNotFoundException;
import com.societycms.exception.UnauthorizedException;
import com.societycms.repository.FlatRepository;
import com.societycms.repository.SocietyRepository;
import com.societycms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final SocietyRepository societyRepository;
    private final FlatRepository flatRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Find society by code
        Society society = societyRepository.findByCode(request.getSocietyCode())
                .orElseThrow(() -> new ResourceNotFoundException("Society not found with code: " + request.getSocietyCode()));

        // Determine role
        UserRole role = UserRole.RESIDENT;
        if (request.getRole() != null) {
            try {
                role = UserRole.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + request.getRole());
            }
        }

        // Build user
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .society(society)
                .role(role)
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .isVerified(false)
                .verificationToken(UUID.randomUUID().toString())
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        // Assign flat if provided
        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ResourceNotFoundException("Flat not found"));
            user.setFlat(flat);
        }

        user = userRepository.save(user);

        // Generate JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        claims.put("societyId", society.getId());
        String token = jwtUtil.generateToken(claims, user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .societyId(society.getId())
                .societyName(society.getName())
                .societyCode(society.getCode())
                .verified(user.getIsVerified())
                .build();
    }

    @Transactional
    public AuthResponse registerSociety(RegisterSocietyRequest request) {
        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new BadRequestException("Admin email already registered");
        }
        if (societyRepository.findByCode(request.getSocietyCode()).isPresent()) {
            throw new BadRequestException("Society code already in use");
        }

        // 1. Create Society
        Society society = new Society();
        society.setName(request.getSocietyName());
        society.setCode(request.getSocietyCode());
        society.setAddress(request.getAddress());
        society.setCity(request.getCity());
        society.setState(request.getState());
        society.setZipCode(request.getZipCode());
        society.setLatitude(request.getGeoFenceLatitude());
        society.setLongitude(request.getGeoFenceLongitude());
        society.setGeoFenceRadius(request.getGeoFenceRadius() != null ? request.getGeoFenceRadius().intValue() : 500);
        society = societyRepository.save(society);

        // 2. Create Admin User
        User admin = User.builder()
                .fullName(request.getAdminName())
                .email(request.getAdminEmail())
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .society(society)
                .role(UserRole.ADMIN)
                .phoneNumber(request.getAdminPhone())
                .isActive(true)
                .isVerified(true) // Admin is auto-verified
                .build();
        admin = userRepository.save(admin);

        // 3. Generate JWT
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", admin.getRole().name());
        claims.put("userId", admin.getId());
        claims.put("societyId", society.getId());
        String token = jwtUtil.generateToken(claims, admin);

        return AuthResponse.builder()
                .token(token)
                .email(admin.getEmail())
                .fullName(admin.getFullName())
                .role(admin.getRole().name())
                .userId(admin.getId())
                .societyId(society.getId())
                .societyName(society.getName())
                .societyCode(society.getCode())
                .verified(admin.getIsVerified())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        if (user.getSociety() != null) {
            claims.put("societyId", user.getSociety().getId());
        }
        String token = jwtUtil.generateToken(claims, user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .userId(user.getId())
                .societyId(user.getSociety() != null ? user.getSociety().getId() : null)
                .societyName(user.getSociety() != null ? user.getSociety().getName() : null)
                .societyCode(user.getSociety() != null ? user.getSociety().getCode() : null)
                .verified(user.getIsVerified())
                .build();
    }

    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid verification token"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired");
        }

        user.setIsVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return "Email verified successfully";
    }
}
