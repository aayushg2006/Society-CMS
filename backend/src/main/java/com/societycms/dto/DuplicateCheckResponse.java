package com.societycms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuplicateCheckResponse {
    private boolean isDuplicate;
    private Long existingComplaintId;
    private String existingComplaintTitle;
    private int existingUpvoteCount;
}
