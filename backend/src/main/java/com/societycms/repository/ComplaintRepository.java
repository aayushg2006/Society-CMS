package com.societycms.repository;

import com.societycms.entity.Complaint;
import com.societycms.enums.ComplaintPriority;
import com.societycms.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Page<Complaint> findBySocietyId(Long societyId, Pageable pageable);

    Page<Complaint> findBySocietyIdAndStatus(Long societyId, ComplaintStatus status, Pageable pageable);

    Page<Complaint> findByUserId(Long userId, Pageable pageable);

    Page<Complaint> findByAssignedStaffId(Long staffId, Pageable pageable);

    long countBySocietyId(Long societyId);

    long countBySocietyIdAndStatus(Long societyId, ComplaintStatus status);

    long countBySocietyIdAndPriority(Long societyId, ComplaintPriority priority);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND c.status IN :statuses")
    Page<Complaint> findBySocietyIdAndStatusIn(@Param("societyId") Long societyId,
                                                @Param("statuses") List<ComplaintStatus> statuses,
                                                Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.status = :status AND c.createdAt < :before")
    List<Complaint> findByStatusAndCreatedAtBefore(@Param("status") ComplaintStatus status,
                                                    @Param("before") LocalDateTime before);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND " +
           "(LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Complaint> searchBySocietyId(@Param("societyId") Long societyId,
                                       @Param("query") String query,
                                       Pageable pageable);

    @Query("SELECT c.category, COUNT(c) FROM Complaint c WHERE c.society.id = :societyId GROUP BY c.category")
    List<Object[]> countByCategoryForSociety(@Param("societyId") Long societyId);

    @Query("SELECT c.status, COUNT(c) FROM Complaint c WHERE c.society.id = :societyId GROUP BY c.status")
    List<Object[]> countByStatusForSociety(@Param("societyId") Long societyId);

    @Query("SELECT c FROM Complaint c WHERE c.expectedCompletionDate IS NOT NULL AND c.expectedCompletionDate < :now AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')")
    List<Complaint> findOverdueComplaints(@Param("now") LocalDateTime now);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND c.status IN (com.societycms.enums.ComplaintStatus.OPEN, com.societycms.enums.ComplaintStatus.IN_PROGRESS) " +
           "AND c.category = :category AND c.scope = :scope " +
           "AND (:commonAreaId IS NULL OR c.commonArea.id = :commonAreaId) " +
           "ORDER BY c.upvoteCount DESC LIMIT 1")
    Complaint findPotentialDuplicate(@Param("societyId") Long societyId,
                                     @Param("category") com.societycms.enums.ComplaintCategory category,
                                     @Param("scope") com.societycms.enums.ComplaintScope scope,
                                     @Param("commonAreaId") Long commonAreaId);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND (" +
           "c.scope = com.societycms.enums.ComplaintScope.SOCIETY OR " +
           "(c.scope = com.societycms.enums.ComplaintScope.BUILDING AND c.flat.building.id = :buildingId))")
    Page<Complaint> findVisibleForResident(@Param("societyId") Long societyId, @Param("buildingId") Long buildingId, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND c.status = :status AND (" +
           "c.scope = com.societycms.enums.ComplaintScope.SOCIETY OR " +
           "(c.scope = com.societycms.enums.ComplaintScope.BUILDING AND c.flat.building.id = :buildingId))")
    Page<Complaint> findVisibleForResidentByStatus(@Param("societyId") Long societyId, @Param("status") ComplaintStatus status, @Param("buildingId") Long buildingId, Pageable pageable);

    @Query("SELECT c FROM Complaint c WHERE c.society.id = :societyId AND (" +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND (" +
           "c.scope = com.societycms.enums.ComplaintScope.SOCIETY OR " +
           "(c.scope = com.societycms.enums.ComplaintScope.BUILDING AND c.flat.building.id = :buildingId))")
    Page<Complaint> searchVisibleForResident(@Param("societyId") Long societyId, @Param("query") String query, @Param("buildingId") Long buildingId, Pageable pageable);
}
