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
public class ActivityLogResponse {
    private Long id;
    private String action;
    private String details;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private LocalDateTime createdAt;
}
