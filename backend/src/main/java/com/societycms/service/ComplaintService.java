package com.societycms.service;

import com.societycms.dto.*;
import com.societycms.entity.*;
import com.societycms.enums.*;
import com.societycms.exception.BadRequestException;
import com.societycms.exception.ResourceNotFoundException;
import com.societycms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final FlatRepository flatRepository;
    private final CommonAreaRepository commonAreaRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ComplaintFollowerRepository followerRepository;
    private final OllamaService ollamaService;
    private final NotificationService notificationService;

    @Transactional
    public ComplaintResponse createComplaint(ComplaintRequest request, User currentUser) {
        if (currentUser.getSociety() == null) {
            throw new BadRequestException("User must belong to a society to create complaints");
        }

        Complaint complaint = new Complaint();
        complaint.setSociety(currentUser.getSociety());
        complaint.setUser(currentUser);
        complaint.setTitle(request.getTitle());
        complaint.setDescription(request.getDescription());
        complaint.setStatus(ComplaintStatus.OPEN);
        complaint.setUpvoteCount(0);

        // Set category
        if (request.getCategory() != null) {
            complaint.setCategory(ComplaintCategory.valueOf(request.getCategory().toUpperCase()));
        }

        // Set scope
        if (request.getScope() != null) {
            complaint.setScope(ComplaintScope.valueOf(request.getScope().toUpperCase()));
        }

        // Auto-calculate priority using Ollama AI
        ComplaintPriority autoPriority = ollamaService.analyzePriority(request.getTitle(), request.getDescription(), request.getCategory());
        complaint.setPriority(autoPriority);

        // Set flat
        if (request.getFlatId() != null) {
            Flat flat = flatRepository.findById(request.getFlatId())
                    .orElseThrow(() -> new ResourceNotFoundException("Flat not found"));
            complaint.setFlat(flat);
        } else if (currentUser.getFlat() != null) {
            complaint.setFlat(currentUser.getFlat());
        }

        // Set common area
        if (request.getCommonAreaId() != null) {
            CommonArea area = commonAreaRepository.findById(request.getCommonAreaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Common area not found"));
            complaint.setCommonArea(area);
        }

        // Set parent complaint
        if (request.getParentComplaintId() != null) {
            Complaint parent = complaintRepository.findById(request.getParentComplaintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent complaint not found"));
            complaint.setParentComplaint(parent);
        }

        complaint.setImageUrl(request.getImageUrl());
        complaint.setLatitude(request.getLatitude());
        complaint.setLongitude(request.getLongitude());

        complaint = complaintRepository.save(complaint);

        // Create activity log
        createActivityLog(complaint, currentUser, "CREATED", "Complaint created: " + complaint.getTitle());

        // Notify admins
        notificationService.notifyAdmins(currentUser.getSociety().getId(), 
            "New Complaint", "A new complaint '" + complaint.getTitle() + "' was filed by " + currentUser.getFullName());

        // Auto-follow the complaint creator
        ComplaintFollower follower = ComplaintFollower.builder()
                .complaint(complaint)
                .user(currentUser)
                .build();
        followerRepository.save(follower);

        return mapToResponse(complaint, currentUser.getId());
    }

    public Page<ComplaintResponse> getComplaintsBySociety(Long societyId, User currentUser, Pageable pageable) {
        if (currentUser.getRole() == UserRole.RESIDENT) {
            Long buildingId = (currentUser.getFlat() != null && currentUser.getFlat().getBuilding() != null) 
                    ? currentUser.getFlat().getBuilding().getId() : -1L;
            return complaintRepository.findVisibleForResident(societyId, buildingId, pageable)
                    .map(c -> mapToResponse(c, currentUser.getId()));
        }
        return complaintRepository.findBySocietyId(societyId, pageable)
                .map(c -> mapToResponse(c, currentUser.getId()));
    }

    public Page<ComplaintResponse> getComplaintsBySocietyAndStatus(Long societyId, ComplaintStatus status,
                                                                     User currentUser, Pageable pageable) {
        if (currentUser.getRole() == UserRole.RESIDENT) {
            Long buildingId = (currentUser.getFlat() != null && currentUser.getFlat().getBuilding() != null) 
                    ? currentUser.getFlat().getBuilding().getId() : -1L;
            return complaintRepository.findVisibleForResidentByStatus(societyId, status, buildingId, pageable)
                    .map(c -> mapToResponse(c, currentUser.getId()));
        }
        return complaintRepository.findBySocietyIdAndStatus(societyId, status, pageable)
                .map(c -> mapToResponse(c, currentUser.getId()));
    }

    public Page<ComplaintResponse> getComplaintsByUser(Long userId, Pageable pageable) {
        return complaintRepository.findByUserId(userId, pageable)
                .map(c -> mapToResponse(c, userId));
    }

    public Page<ComplaintResponse> getAssignedComplaints(Long staffId, Pageable pageable) {
        return complaintRepository.findByAssignedStaffId(staffId, pageable)
                .map(c -> mapToResponse(c, staffId));
    }

    public Page<ComplaintResponse> searchComplaints(Long societyId, String query, User currentUser, Pageable pageable) {
        if (currentUser.getRole() == UserRole.RESIDENT) {
            Long buildingId = (currentUser.getFlat() != null && currentUser.getFlat().getBuilding() != null) 
                    ? currentUser.getFlat().getBuilding().getId() : -1L;
            return complaintRepository.searchVisibleForResident(societyId, query, buildingId, pageable)
                    .map(c -> mapToResponse(c, currentUser.getId()));
        }
        return complaintRepository.searchBySocietyId(societyId, query, pageable)
                .map(c -> mapToResponse(c, currentUser.getId()));
    }

    public ComplaintResponse getComplaintById(Long id, Long currentUserId) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));
        return mapToResponse(complaint, currentUserId);
    }

    public DuplicateCheckResponse checkDuplicate(String categoryStr, String scopeStr, Long commonAreaId, Long societyId) {
        if (categoryStr == null || scopeStr == null) {
            return new DuplicateCheckResponse(false, null, null, 0);
        }

        ComplaintCategory category = ComplaintCategory.valueOf(categoryStr.toUpperCase());
        ComplaintScope scope = ComplaintScope.valueOf(scopeStr.toUpperCase());

        // Don't deduplicate FLAT level complaints
        if (scope == ComplaintScope.FLAT) {
            return new DuplicateCheckResponse(false, null, null, 0);
        }

        Complaint duplicate = complaintRepository.findPotentialDuplicate(societyId, category, scope, commonAreaId);
        
        if (duplicate != null) {
            return DuplicateCheckResponse.builder()
                    .isDuplicate(true)
                    .existingComplaintId(duplicate.getId())
                    .existingComplaintTitle(duplicate.getTitle())
                    .existingUpvoteCount(duplicate.getUpvoteCount())
                    .build();
        }

        return new DuplicateCheckResponse(false, null, null, 0);
    }

    @Transactional
    public ComplaintResponse updateStatus(Long complaintId, StatusUpdateRequest request, User actor) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        ComplaintStatus newStatus = ComplaintStatus.valueOf(request.getStatus().toUpperCase());
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(newStatus);

        if (newStatus == ComplaintStatus.RESOLVED) {
            if (actor.getRole() == UserRole.STAFF && (request.getVendorBeforeImageUrl() == null || request.getVendorAfterImageUrl() == null)) {
                throw new BadRequestException("Before and after images are required to resolve a task.");
            }
            if (request.getVendorBeforeImageUrl() != null) {
                complaint.setVendorBeforeImageUrl(request.getVendorBeforeImageUrl());
            }
            if (request.getVendorAfterImageUrl() != null) {
                complaint.setVendorAfterImageUrl(request.getVendorAfterImageUrl());
            }
            complaint.setResolvedAt(LocalDateTime.now());
        }

        complaint = complaintRepository.save(complaint);

        String details = "Status changed from " + oldStatus + " to " + newStatus;
        if (request.getComment() != null) {
            details += ". Comment: " + request.getComment();
        }
        createActivityLog(complaint, actor, "STATUS_CHANGED", details);

        notificationService.createNotification(complaint.getUser(), 
            "Complaint Status Updated", "Your complaint '" + complaint.getTitle() + "' is now " + newStatus);

        return mapToResponse(complaint, actor.getId());
    }

    @Transactional
    public ComplaintResponse assignStaff(Long complaintId, AssignStaffRequest request, User actor) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found"));

        if (staff.getRole() != UserRole.STAFF) {
            throw new BadRequestException("User is not a staff member");
        }

        complaint.setAssignedStaff(staff);
        if (request.getExpectedCompletionDate() != null) {
            complaint.setExpectedCompletionDate(request.getExpectedCompletionDate());
        }

        if (complaint.getStatus() == ComplaintStatus.OPEN) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }

        complaint = complaintRepository.save(complaint);

        String details = "Assigned to " + staff.getFullName();
        if (request.getComment() != null) {
            details += ". Comment: " + request.getComment();
        }
        createActivityLog(complaint, actor, "ASSIGNED", details);

        notificationService.createNotification(complaint.getUser(), 
            "Staff Assigned", "Staff " + staff.getFullName() + " was assigned to your complaint '" + complaint.getTitle() + "'");
            
        notificationService.createNotification(staff, 
            "New Task Assigned", "You have been assigned to complaint '" + complaint.getTitle() + "'");

        return mapToResponse(complaint, actor.getId());
    }

    @Transactional
    public ComplaintResponse upvoteComplaint(Long complaintId, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        complaint.setUpvoteCount(complaint.getUpvoteCount() + 1);

        // Auto-escalate if many upvotes
        if (complaint.getUpvoteCount() >= 10 && complaint.getPriority() == ComplaintPriority.LOW) {
            complaint.setPriority(ComplaintPriority.MEDIUM);
            createActivityLog(complaint, currentUser, "PRIORITY_ESCALATED",
                    "Priority auto-escalated to MEDIUM due to high upvotes (" + complaint.getUpvoteCount() + ")");
        } else if (complaint.getUpvoteCount() >= 25 && complaint.getPriority() == ComplaintPriority.MEDIUM) {
            complaint.setPriority(ComplaintPriority.HIGH);
            createActivityLog(complaint, currentUser, "PRIORITY_ESCALATED",
                    "Priority auto-escalated to HIGH due to high upvotes (" + complaint.getUpvoteCount() + ")");
        }

        complaint = complaintRepository.save(complaint);
        createActivityLog(complaint, currentUser, "UPVOTED", "Complaint upvoted");

        return mapToResponse(complaint, currentUser.getId());
    }

    @Transactional
    public void toggleFollow(Long complaintId, User currentUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (followerRepository.existsByComplaintIdAndUserId(complaintId, currentUser.getId())) {
            followerRepository.deleteByComplaintIdAndUserId(complaintId, currentUser.getId());
        } else {
            ComplaintFollower follower = ComplaintFollower.builder()
                    .complaint(complaint)
                    .user(currentUser)
                    .build();
            followerRepository.save(follower);
        }
    }

    public List<ActivityLogResponse> getActivityLogs(Long complaintId) {
        return activityLogRepository.findByComplaintIdOrderByCreatedAtDesc(complaintId)
                .stream()
                .map(log -> ActivityLogResponse.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .details(log.getDetails())
                        .actorId(log.getActor().getId())
                        .actorName(log.getActor().getFullName())
                        .actorRole(log.getActor().getRole().name())
                        .createdAt(log.getCreatedAt())
                        .build())
                .toList();
    }

    private void createActivityLog(Complaint complaint, User actor, String action, String details) {
        ActivityLog log = ActivityLog.builder()
                .complaint(complaint)
                .actor(actor)
                .action(action)
                .details(details)
                .build();
        activityLogRepository.save(log);
    }

    private ComplaintResponse mapToResponse(Complaint c, Long currentUserId) {
        ComplaintResponse response = ComplaintResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory() != null ? c.getCategory().name() : null)
                .scope(c.getScope() != null ? c.getScope().name() : null)
                .priority(c.getPriority() != null ? c.getPriority().name() : null)
                .status(c.getStatus() != null ? c.getStatus().name() : null)
                .imageUrl(c.getImageUrl())
                .vendorBeforeImageUrl(c.getVendorBeforeImageUrl())
                .vendorAfterImageUrl(c.getVendorAfterImageUrl())
                .upvoteCount(c.getUpvoteCount())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .expectedCompletionDate(c.getExpectedCompletionDate())
                .resolvedAt(c.getResolvedAt())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .userId(c.getUser().getId())
                .userName(c.getUser().getFullName())
                .userEmail(c.getUser().getEmail())
                .societyId(c.getSociety().getId())
                .parentComplaintId(c.getParentComplaint() != null ? c.getParentComplaint().getId() : null)
                .build();

        if (c.getFlat() != null) {
            response.setFlatId(c.getFlat().getId());
            response.setFlatNumber(c.getFlat().getFlatNumber());
            if (c.getFlat().getBuilding() != null) {
                response.setBuildingName(c.getFlat().getBuilding().getName());
            }
        }

        if (c.getCommonArea() != null) {
            response.setCommonAreaId(c.getCommonArea().getId());
            response.setCommonAreaName(c.getCommonArea().getName());
        }

        if (c.getAssignedStaff() != null) {
            response.setAssignedStaffId(c.getAssignedStaff().getId());
            response.setAssignedStaffName(c.getAssignedStaff().getFullName());
            response.setAssignedStaffSpecialization(
                    c.getAssignedStaff().getStaffSpecialization() != null ?
                            c.getAssignedStaff().getStaffSpecialization().name() : null);
        }

        if (c.getFollowers() != null) {
            response.setFollowerCount(c.getFollowers().size());
            response.setFollowing(c.getFollowers().stream()
                    .anyMatch(f -> f.getUser().getId().equals(currentUserId)));
        }

        return response;
    }
}
