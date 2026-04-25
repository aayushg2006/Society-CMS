package com.societycms.dto;

import lombok.Data;

@Data
public class FlatRequest {
    private Long buildingId;
    private Integer floorNumber;
    private String flatNumber;
    private String type;
    private String occupancyStatus;
    private String intercomExtension;
}
