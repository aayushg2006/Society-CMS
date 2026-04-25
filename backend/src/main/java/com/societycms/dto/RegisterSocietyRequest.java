package com.societycms.dto;

import lombok.Data;

@Data
public class RegisterSocietyRequest {
    // Admin Details
    private String adminName;
    private String adminEmail;
    private String adminPassword;
    private String adminPhone;

    // Society Details
    private String societyName;
    private String societyCode;
    private String address;
    private String city;
    private String state;
    private String zipCode;
    private Double geoFenceLatitude;
    private Double geoFenceLongitude;
    private Double geoFenceRadius;
}
