package com.societycms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class BulkUploadResult {
    private int successCount;
    private int failCount;
    private List<String> errors;
}
