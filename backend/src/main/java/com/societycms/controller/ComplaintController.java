package com.societycms.controller;

import com.societycms.dto.*;
import com.societycms.entity.User;
import com.societycms.enums.ComplaintStatus;
import com.societycms.enums.UserRole;
import com.societycms.exception.UnauthorizedException;
import com.societycms.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;

    @PostMapping
    public ResponseEntity<ApiResponse<ComplaintResponse>> createComplaint(
            @Valid @RequestBody ComplaintRequest request,
            @AuthenticationPrincipal User currentUser) {
        ComplaintResponse response = complaintService.createComplaint(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Complaint created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getComplaints(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size,
                sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending());

        Page<ComplaintResponse> complaints;

        if (currentUser.getRole() == UserRole.STAFF) {
            // Staff sees only assigned complaints
            complaints = complaintService.getAssignedComplaints(currentUser.getId(), pageable);
        } else if (currentUser.getRole() == UserRole.RESIDENT) {
            // Residents see society-wide complaints
            if (currentUser.getSociety() == null) {
                throw new UnauthorizedException("User does not belong to a society");
            }
            if (search != null && !search.isEmpty()) {
                complaints = complaintService.searchComplaints(
                        currentUser.getSociety().getId(), search, currentUser, pageable);
            } else if (status != null) {
                complaints = complaintService.getComplaintsBySocietyAndStatus(
                        currentUser.getSociety().getId(),
                        ComplaintStatus.valueOf(status.toUpperCase()),
                        currentUser, pageable);
            } else {
                complaints = complaintService.getComplaintsBySociety(
                        currentUser.getSociety().getId(), currentUser, pageable);
            }
        } else {
            // Admin/Secretary see all society complaints
            if (currentUser.getSociety() == null) {
                throw new UnauthorizedException("User does not belong to a society");
            }
            if (search != null && !search.isEmpty()) {
                complaints = complaintService.searchComplaints(
                        currentUser.getSociety().getId(), search, currentUser, pageable);
            } else if (status != null) {
                complaints = complaintService.getComplaintsBySocietyAndStatus(
                        currentUser.getSociety().getId(),
                        ComplaintStatus.valueOf(status.toUpperCase()),
                        currentUser, pageable);
            } else {
                complaints = complaintService.getComplaintsBySociety(
                        currentUser.getSociety().getId(), currentUser, pageable);
            }
        }

        return ResponseEntity.ok(ApiResponse.success(complaints));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getMyComplaints(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ComplaintResponse> complaints = complaintService.getComplaintsByUser(currentUser.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(complaints));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaint(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ComplaintResponse response = complaintService.getComplaintById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/check-duplicate")
    public ResponseEntity<ApiResponse<DuplicateCheckResponse>> checkDuplicate(
            @RequestParam String category,
            @RequestParam String scope,
            @RequestParam(required = false) Long commonAreaId,
            @AuthenticationPrincipal User currentUser) {
        
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("User does not belong to a society");
        }
        
        DuplicateCheckResponse response = complaintService.checkDuplicate(
                category, scope, commonAreaId, currentUser.getSociety().getId());
                
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {

        // Only admin, secretary, staff can update status
        if (currentUser.getRole() != UserRole.ADMIN &&
            currentUser.getRole() != UserRole.SECRETARY &&
            currentUser.getRole() != UserRole.STAFF) {
            throw new UnauthorizedException("Not authorized to update status");
        }

        ComplaintResponse response = complaintService.updateStatus(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Status updated successfully", response));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<ComplaintResponse>> assignStaff(
            @PathVariable Long id,
            @RequestBody AssignStaffRequest request,
            @AuthenticationPrincipal User currentUser) {

        // Only admin/secretary can assign
        if (currentUser.getRole() != UserRole.ADMIN &&
            currentUser.getRole() != UserRole.SECRETARY) {
            throw new UnauthorizedException("Admin access required to assign staff");
        }

        ComplaintResponse response = complaintService.assignStaff(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Staff assigned successfully", response));
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<ApiResponse<ComplaintResponse>> upvote(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ComplaintResponse response = complaintService.upvoteComplaint(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Upvoted successfully", response));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<Void>> toggleFollow(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        complaintService.toggleFollow(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Follow toggled", null));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getActivityLogs(@PathVariable Long id) {
        List<ActivityLogResponse> logs = complaintService.getActivityLogs(id);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
