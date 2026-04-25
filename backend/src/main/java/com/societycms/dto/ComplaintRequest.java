package com.societycms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ComplaintRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String category;
    private String scope;
    private String priority;
    private Long flatId;
    private Long commonAreaId;
    private String imageUrl;
    private Long parentComplaintId;
    private Double latitude;
    private Double longitude;
}
