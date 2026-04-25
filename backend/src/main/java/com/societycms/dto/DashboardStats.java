package com.societycms.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalComplaints;
    private long openComplaints;
    private long inProgressComplaints;
    private long resolvedComplaints;
    private long closedComplaints;
    private long criticalComplaints;
    private long highPriorityComplaints;
    private long totalUsers;
    private long totalStaff;
    private long overdueComplaints;
    private Map<String, Long> complaintsByCategory;
    private Map<String, Long> complaintsByStatus;
}
