package com.societycms.service;

import com.societycms.dto.*;
import com.societycms.entity.*;
import com.societycms.enums.*;
import com.societycms.exception.BadRequestException;
import com.societycms.exception.ResourceNotFoundException;
import com.societycms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SocietyService {

    private final SocietyRepository societyRepository;
    private final BuildingRepository buildingRepository;
    private final FlatRepository flatRepository;
    private final CommonAreaRepository commonAreaRepository;
    private final UserRepository userRepository;
    private final ComplaintRepository complaintRepository;
    private final PasswordEncoder passwordEncoder;

    // ========== Society ==========

    @Transactional
    public Society createSociety(SocietyRequest request) {
        if (societyRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Society code already exists");
        }

        Society society = Society.builder()
                .name(request.getName())
                .code(request.getCode())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .geoFenceRadius(request.getGeoFenceRadius() != null ? request.getGeoFenceRadius() : 500)
                .build();

        if (request.getSubscriptionPlan() != null) {
            society.setSubscriptionPlan(SubscriptionPlan.valueOf(request.getSubscriptionPlan().toUpperCase()));
        }

        return societyRepository.save(society);
    }

    public List<Society> getAllSocieties() {
        return societyRepository.findAll();
    }

    public Society getSocietyById(Long id) {
        return societyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found"));
    }

    public Society getSocietyByCode(String code) {
        return societyRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found with code: " + code));
    }

    // ========== Buildings ==========

    @Transactional
    public Building createBuilding(Long societyId, BuildingRequest request) {
        Society society = getSocietyById(societyId);

        Building building = Building.builder()
                .society(society)
                .name(request.getName())
                .code(request.getCode())
                .totalFloors(request.getTotalFloors() != null ? request.getTotalFloors() : 1)
                .hasLift(request.getHasLift() != null ? request.getHasLift() : false)
                .build();

        return buildingRepository.save(building);
    }

    public List<Building> getBuildingsBySociety(Long societyId) {
        return buildingRepository.findBySocietyId(societyId);
    }

    // ========== Flats ==========

    @Transactional
    public Flat createFlat(FlatRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));

        Flat flat = Flat.builder()
                .building(building)
                .floorNumber(request.getFloorNumber())
                .flatNumber(request.getFlatNumber())
                .intercomExtension(request.getIntercomExtension())
                .build();

        if (request.getType() != null) {
            flat.setType(FlatType.valueOf("_" + request.getType().toUpperCase()));
        }
        if (request.getOccupancyStatus() != null) {
            flat.setOccupancyStatus(OccupancyStatus.valueOf(request.getOccupancyStatus().toUpperCase()));
        }

        return flatRepository.save(flat);
    }

    public List<Flat> getFlatsByBuilding(Long buildingId) {
        return flatRepository.findByBuildingId(buildingId);
    }

    public List<Flat> getFlatsBySociety(Long societyId) {
        return flatRepository.findByBuildingSocietyId(societyId);
    }

    // ========== Common Areas ==========

    @Transactional
    public CommonArea createCommonArea(Long societyId, String name, Long buildingId, Integer floorNumber) {
        Society society = getSocietyById(societyId);

        CommonArea area = CommonArea.builder()
                .society(society)
                .name(name)
                .floorNumber(floorNumber)
                .build();

        if (buildingId != null) {
            Building building = buildingRepository.findById(buildingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
            area.setBuilding(building);
        }

        return commonAreaRepository.save(area);
    }

    public List<CommonArea> getCommonAreasBySociety(Long societyId) {
        return commonAreaRepository.findBySocietyId(societyId);
    }

    // ========== Users / Staff ==========

    public List<UserResponse> getUsersBySociety(Long societyId) {
        return userRepository.findBySocietyId(societyId).stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getStaffBySociety(Long societyId) {
        return userRepository.findBySocietyIdAndRole(societyId, UserRole.STAFF).stream()
                .map(this::mapUserToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setRole(UserRole.valueOf(newRole.toUpperCase()));
        user = userRepository.save(user);
        return mapUserToResponse(user);
    }

    @Transactional
    public UserResponse toggleUserActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsActive(!user.getIsActive());
        user = userRepository.save(user);
        return mapUserToResponse(user);
    }

    @Transactional
    public UserResponse verifyUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setIsVerified(true);
        user = userRepository.save(user);
        return mapUserToResponse(user);
    }

    @Transactional
    public BulkUploadResult bulkUploadUsers(Long societyId, org.springframework.web.multipart.MultipartFile file) {
        Society society = getSocietyById(societyId);
        int successCount = 0;
        int failCount = 0;
        List<String> errors = new java.util.ArrayList<>();

        try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            while ((line = br.readLine()) != null) {
                if (firstLine) {
                    firstLine = false; // skip header
                    continue;
                }
                String[] data = line.split(",");
                if (data.length < 4) {
                    failCount++;
                    errors.add("Invalid format: " + line);
                    continue;
                }

                try {
                    String fullName = data[0].trim();
                    String email = data[1].trim();
                    String password = data[2].trim();
                    String roleStr = data[3].trim().toUpperCase();
                    String phone = data.length > 4 ? data[4].trim() : null;
                    String buildingName = data.length > 5 && !data[5].trim().isEmpty() ? data[5].trim() : null;
                    String flatNumber = data.length > 6 && !data[6].trim().isEmpty() ? data[6].trim() : null;

                    if (userRepository.existsByEmail(email)) {
                        failCount++;
                        errors.add("Email already exists: " + email);
                        continue;
                    }

                    UserRole role = UserRole.valueOf(roleStr);
                    
                    Flat userFlat = null;
                    if (buildingName != null && flatNumber != null) {
                        Building building = buildingRepository.findBySocietyIdAndName(societyId, buildingName)
                            .orElseGet(() -> {
                                Building b = Building.builder()
                                    .society(society)
                                    .name(buildingName)
                                    .code(buildingName.length() > 3 ? buildingName.substring(0, 3).toUpperCase() : buildingName.toUpperCase())
                                    .totalFloors(1)
                                    .hasLift(false)
                                    .build();
                                return buildingRepository.save(b);
                            });
                        
                        userFlat = flatRepository.findByBuildingIdAndFlatNumber(building.getId(), flatNumber)
                            .orElseGet(() -> {
                                Flat f = Flat.builder()
                                    .building(building)
                                    .floorNumber(1)
                                    .flatNumber(flatNumber)
                                    .type(FlatType._2BHK)
                                    .occupancyStatus(OccupancyStatus.OCCUPIED)
                                    .build();
                                return flatRepository.save(f);
                            });
                            
                        if (userFlat.getOccupancyStatus() == OccupancyStatus.VACANT) {
                            userFlat.setOccupancyStatus(OccupancyStatus.OCCUPIED);
                            userFlat = flatRepository.save(userFlat);
                        }
                    }

                    User user = User.builder()
                            .fullName(fullName)
                            .email(email)
                            .passwordHash(passwordEncoder.encode(password))
                            .society(society)
                            .role(role)
                            .phoneNumber(phone)
                            .flat(userFlat)
                            .isActive(true)
                            .isVerified(true) // Auto verified since admin is uploading
                            .build();

                    userRepository.save(user);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    errors.add("Error processing line [" + line + "]: " + e.getMessage());
                }
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to process file: " + e.getMessage());
        }

        return new BulkUploadResult(successCount, failCount, errors);
    }

    @Transactional
    public UserResponse createUser(Long societyId, AddUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        Society society = getSocietyById(societyId);
        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid role");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .society(society)
                .role(role)
                .phoneNumber(request.getPhoneNumber())
                .isActive(true)
                .isVerified(true) // Auto verified since admin created
                .build();

        user = userRepository.save(user);
        return mapUserToResponse(user);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ========== Dashboard ==========

    public DashboardStats getDashboardStats(Long societyId) {
        long total = complaintRepository.countBySocietyId(societyId);
        long open = complaintRepository.countBySocietyIdAndStatus(societyId, ComplaintStatus.OPEN);
        long inProgress = complaintRepository.countBySocietyIdAndStatus(societyId, ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countBySocietyIdAndStatus(societyId, ComplaintStatus.RESOLVED);
        long closed = complaintRepository.countBySocietyIdAndStatus(societyId, ComplaintStatus.CLOSED);
        long critical = complaintRepository.countBySocietyIdAndPriority(societyId, ComplaintPriority.CRITICAL);
        long high = complaintRepository.countBySocietyIdAndPriority(societyId, ComplaintPriority.HIGH);
        long users = userRepository.countBySocietyId(societyId);
        long staff = userRepository.countBySocietyIdAndRole(societyId, UserRole.STAFF);
        long overdue = complaintRepository.findOverdueComplaints(LocalDateTime.now()).stream()
                .filter(c -> c.getSociety().getId().equals(societyId))
                .count();

        Map<String, Long> byCategory = new HashMap<>();
        complaintRepository.countByCategoryForSociety(societyId).forEach(row -> {
            byCategory.put(row[0].toString(), (Long) row[1]);
        });

        Map<String, Long> byStatus = new HashMap<>();
        complaintRepository.countByStatusForSociety(societyId).forEach(row -> {
            byStatus.put(row[0].toString(), (Long) row[1]);
        });

        return DashboardStats.builder()
                .totalComplaints(total)
                .openComplaints(open)
                .inProgressComplaints(inProgress)
                .resolvedComplaints(resolved)
                .closedComplaints(closed)
                .criticalComplaints(critical)
                .highPriorityComplaints(high)
                .totalUsers(users)
                .totalStaff(staff)
                .overdueComplaints(overdue)
                .complaintsByCategory(byCategory)
                .complaintsByStatus(byStatus)
                .build();
    }

    // ========== Geo-fence ==========

    public boolean isWithinGeoFence(Long societyId, double lat, double lng) {
        Society society = getSocietyById(societyId);
        if (society.getLatitude() == null || society.getLongitude() == null) {
            return true; // No geo-fence configured
        }

        double distance = calculateDistance(
                society.getLatitude(), society.getLongitude(), lat, lng);

        return distance <= (society.getGeoFenceRadius() != null ? society.getGeoFenceRadius() : 500);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371000; // Earth's radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private UserResponse mapUserToResponse(User user) {
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phoneNumber(user.getPhoneNumber())
                .profileImageUrl(user.getProfileImageUrl())
                .staffSpecialization(user.getStaffSpecialization() != null ?
                        user.getStaffSpecialization().name() : null)
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .build();

        if (user.getFlat() != null) {
            response.setFlatId(user.getFlat().getId());
            response.setFlatNumber(user.getFlat().getFlatNumber());
            if (user.getFlat().getBuilding() != null) {
                response.setBuildingName(user.getFlat().getBuilding().getName());
            }
        }

        if (user.getSociety() != null) {
            response.setSocietyId(user.getSociety().getId());
            response.setSocietyName(user.getSociety().getName());
        }

        return response;
    }
}
