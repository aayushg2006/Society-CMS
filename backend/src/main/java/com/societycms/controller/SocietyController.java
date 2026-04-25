package com.societycms.controller;

import com.societycms.dto.*;
import com.societycms.entity.*;
import com.societycms.enums.UserRole;
import com.societycms.exception.UnauthorizedException;
import com.societycms.service.SocietyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SocietyController {

    private final SocietyService societyService;

    // ===== Society =====

    @GetMapping("/societies/{id}")
    public ResponseEntity<ApiResponse<Society>> getSociety(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(societyService.getSocietyById(id)));
    }

    @GetMapping("/societies/code/{code}")
    public ResponseEntity<ApiResponse<Society>> getSocietyByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(societyService.getSocietyByCode(code)));
    }

    // ===== Buildings =====

    @PostMapping("/buildings")
    public ResponseEntity<ApiResponse<Building>> createBuilding(
            @AuthenticationPrincipal User currentUser,
            @RequestBody BuildingRequest request) {
        ensureAdmin(currentUser);
        Building building = societyService.createBuilding(currentUser.getSociety().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Building created", building));
    }

    @GetMapping("/buildings")
    public ResponseEntity<ApiResponse<List<Building>>> getBuildings(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        return ResponseEntity.ok(ApiResponse.success(
                societyService.getBuildingsBySociety(currentUser.getSociety().getId())));
    }

    // ===== Flats =====

    @PostMapping("/flats")
    public ResponseEntity<ApiResponse<Flat>> createFlat(
            @AuthenticationPrincipal User currentUser,
            @RequestBody FlatRequest request) {
        ensureAdmin(currentUser);
        Flat flat = societyService.createFlat(request);
        return ResponseEntity.ok(ApiResponse.success("Flat created", flat));
    }

    @GetMapping("/flats")
    public ResponseEntity<ApiResponse<List<Flat>>> getFlats(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) Long buildingId) {
        if (buildingId != null) {
            return ResponseEntity.ok(ApiResponse.success(societyService.getFlatsByBuilding(buildingId)));
        }
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        return ResponseEntity.ok(ApiResponse.success(
                societyService.getFlatsBySociety(currentUser.getSociety().getId())));
    }

    // ===== Common Areas =====

    @PostMapping("/common-areas")
    public ResponseEntity<ApiResponse<CommonArea>> createCommonArea(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, Object> request) {
        ensureAdmin(currentUser);
        CommonArea area = societyService.createCommonArea(
                currentUser.getSociety().getId(),
                (String) request.get("name"),
                request.get("buildingId") != null ? Long.parseLong(request.get("buildingId").toString()) : null,
                request.get("floorNumber") != null ? Integer.parseInt(request.get("floorNumber").toString()) : null
        );
        return ResponseEntity.ok(ApiResponse.success("Common area created", area));
    }

    @GetMapping("/common-areas")
    public ResponseEntity<ApiResponse<List<CommonArea>>> getCommonAreas(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        return ResponseEntity.ok(ApiResponse.success(
                societyService.getCommonAreasBySociety(currentUser.getSociety().getId())));
    }

    // ===== Users =====

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getUsers(@AuthenticationPrincipal User currentUser) {
        ensureAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.success(
                societyService.getUsersBySociety(currentUser.getSociety().getId())));
    }

    @PostMapping("/users/bulk-upload")
    public ResponseEntity<ApiResponse<BulkUploadResult>> bulkUploadUsers(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        ensureAdmin(currentUser);
        BulkUploadResult result = societyService.bulkUploadUsers(currentUser.getSociety().getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Bulk upload completed", result));
    }

    @GetMapping("/users/staff")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getStaff(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        return ResponseEntity.ok(ApiResponse.success(
                societyService.getStaffBySociety(currentUser.getSociety().getId())));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User currentUser) {
        ensureAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.success(
                societyService.updateUserRole(id, request.get("role"))));
    }

    @PutMapping("/users/{id}/toggle-active")
    public ResponseEntity<ApiResponse<UserResponse>> toggleActive(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ensureAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.success(societyService.toggleUserActive(id)));
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<ApiResponse<UserResponse>> verifyUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        ensureAdmin(currentUser);
        return ResponseEntity.ok(ApiResponse.success(societyService.verifyUser(id)));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody AddUserRequest request) {
        ensureAdmin(currentUser);
        UserResponse response = societyService.createUser(currentUser.getSociety().getId(), request);
        return ResponseEntity.ok(ApiResponse.success("User created successfully", response));
    }

    @PutMapping("/users/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        societyService.changePassword(currentUser.getId(), request.getCurrentPassword(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    // ===== Dashboard =====

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard(@AuthenticationPrincipal User currentUser) {
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        DashboardStats stats = societyService.getDashboardStats(currentUser.getSociety().getId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ===== Geo-fence =====

    @PostMapping("/geo-fence/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyGeoFence(
            @AuthenticationPrincipal User currentUser,
            @RequestBody GeoFenceRequest request) {
        if (currentUser.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
        boolean isWithin = societyService.isWithinGeoFence(
                currentUser.getSociety().getId(), request.getLatitude(), request.getLongitude());
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "withinFence", isWithin,
                "message", isWithin ? "You are within the society premises" : "You are outside the society premises"
        )));
    }

    private void ensureAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN &&
            user.getRole() != UserRole.SECRETARY) {
            throw new UnauthorizedException("Admin access required");
        }
        if (user.getSociety() == null) {
            throw new UnauthorizedException("Not in a society");
        }
    }
}
