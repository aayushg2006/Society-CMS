package com.societycms.dto;

import lombok.Data;

@Data
public class StatusUpdateRequest {
    private String status;
    private String comment;
    private String vendorBeforeImageUrl;
    private String vendorAfterImageUrl;
}
