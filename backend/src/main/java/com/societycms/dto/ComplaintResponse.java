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
public class ComplaintResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private String scope;
    private String priority;
    private String status;
    private String imageUrl;
    private String vendorBeforeImageUrl;
    private String vendorAfterImageUrl;
    private Integer upvoteCount;
    private Double latitude;
    private Double longitude;
    private LocalDateTime expectedCompletionDate;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // User info
    private Long userId;
    private String userName;
    private String userEmail;

    // Flat info
    private Long flatId;
    private String flatNumber;
    private String buildingName;

    // Common area info
    private Long commonAreaId;
    private String commonAreaName;

    // Assigned staff info
    private Long assignedStaffId;
    private String assignedStaffName;
    private String assignedStaffSpecialization;

    // Parent complaint
    private Long parentComplaintId;

    // Society info
    private Long societyId;

    // Follow count
    private int followerCount;
    private boolean isFollowing;
}
