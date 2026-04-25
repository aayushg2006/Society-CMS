package com.societycms.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignStaffRequest {
    private Long staffId;
    private LocalDateTime expectedCompletionDate;
    private String comment;
}
