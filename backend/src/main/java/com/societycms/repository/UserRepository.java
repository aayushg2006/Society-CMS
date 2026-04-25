package com.societycms.repository;

import com.societycms.entity.User;
import com.societycms.enums.StaffSpecialization;
import com.societycms.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findBySocietyId(Long societyId);
    List<User> findBySocietyIdAndRole(Long societyId, UserRole role);
    List<User> findBySocietyIdAndRoleAndStaffSpecialization(Long societyId, UserRole role, StaffSpecialization specialization);
    Optional<User> findByVerificationToken(String token);
    long countBySocietyId(Long societyId);
    long countBySocietyIdAndRole(Long societyId, UserRole role);
}
