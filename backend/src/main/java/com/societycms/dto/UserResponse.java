package com.societycms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String phoneNumber;
    private String profileImageUrl;
    private String staffSpecialization;
    private boolean isActive;
    private boolean isVerified;
    private LocalDateTime createdAt;

    // Flat info
    private Long flatId;
    private String flatNumber;
    private String buildingName;

    // Society info
    private Long societyId;
    private String societyName;
}
