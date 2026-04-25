package com.societycms.repository;

import com.societycms.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);
}
