package com.societycms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocietyRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Code is required")
    private String code;

    private String address;
    private String city;
    private String state;
    private String zipCode;
    private String subscriptionPlan;
    private Double latitude;
    private Double longitude;
    private Integer geoFenceRadius;
}
