package com.societycms.dto;

import lombok.Data;

@Data
public class BuildingRequest {
    private String name;
    private String code;
    private Integer totalFloors;
    private Boolean hasLift;
}
