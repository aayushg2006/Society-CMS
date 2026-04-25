package com.societycms.repository;

import com.societycms.entity.ComplaintFollower;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ComplaintFollowerRepository extends JpaRepository<ComplaintFollower, Long> {
    List<ComplaintFollower> findByComplaintId(Long complaintId);
    List<ComplaintFollower> findByUserId(Long userId);
    Optional<ComplaintFollower> findByComplaintIdAndUserId(Long complaintId, Long userId);
    boolean existsByComplaintIdAndUserId(Long complaintId, Long userId);
    void deleteByComplaintIdAndUserId(Long complaintId, Long userId);
}
