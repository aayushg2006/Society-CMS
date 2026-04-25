package com.societycms.entity;

import com.societycms.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "complaints")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flat_id")
    private Flat flat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "common_area_id")
    private CommonArea commonArea;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 30)
    private ComplaintCategory category = ComplaintCategory.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", length = 30)
    private ComplaintScope scope = ComplaintScope.FLAT;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 30)
    private ComplaintPriority priority = ComplaintPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private ComplaintStatus status = ComplaintStatus.OPEN;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "vendor_before_image_url", length = 500)
    private String vendorBeforeImageUrl;

    @Column(name = "vendor_after_image_url", length = 500)
    private String vendorAfterImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_staff_id")
    private User assignedStaff;

    @Column(name = "expected_completion_date")
    private LocalDateTime expectedCompletionDate;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "upvote_count")
    private Integer upvoteCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_complaint_id")
    private Complaint parentComplaint;

    private Double latitude;
    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL)
    private List<ActivityLog> activityLogs;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL)
    private List<ComplaintFollower> followers;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
