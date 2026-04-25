package com.societycms.automation;

import com.societycms.entity.Complaint;
import com.societycms.entity.User;
import com.societycms.enums.*;
import com.societycms.repository.ActivityLogRepository;
import com.societycms.repository.ComplaintRepository;
import com.societycms.repository.UserRepository;
import com.societycms.entity.ActivityLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ComplaintAutomation {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;

    // Map complaint categories to staff specializations for auto-assignment
    private static final Map<ComplaintCategory, StaffSpecialization> CATEGORY_TO_SPEC = new HashMap<>() {{
        put(ComplaintCategory.PLUMBING, StaffSpecialization.PLUMBER);
        put(ComplaintCategory.ELECTRICAL, StaffSpecialization.ELECTRICIAN);
        put(ComplaintCategory.CIVIL, StaffSpecialization.CARPENTER);
        put(ComplaintCategory.SECURITY, StaffSpecialization.SECURITY);
        put(ComplaintCategory.CLEANING, StaffSpecialization.CLEANING);
        put(ComplaintCategory.PEST_CONTROL, StaffSpecialization.GENERAL);
        put(ComplaintCategory.PARKING, StaffSpecialization.SECURITY);
        put(ComplaintCategory.NOISE, StaffSpecialization.SECURITY);
        put(ComplaintCategory.OTHER, StaffSpecialization.GENERAL);
    }};

    /**
     * Auto-escalate priority for complaints that have been open for too long.
     * Runs every hour.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void autoEscalatePriority() {
        log.info("Running auto-escalation check...");

        // Escalate LOW → MEDIUM after 48 hours
        List<Complaint> oldLowComplaints = complaintRepository
                .findByStatusAndCreatedAtBefore(ComplaintStatus.OPEN, LocalDateTime.now().minusHours(48));

        for (Complaint complaint : oldLowComplaints) {
            if (complaint.getPriority() == ComplaintPriority.LOW) {
                complaint.setPriority(ComplaintPriority.MEDIUM);
                complaintRepository.save(complaint);
                logAutomation(complaint, "PRIORITY_ESCALATED",
                        "Auto-escalated from LOW to MEDIUM (open for 48+ hours)");
            }
        }

        // Escalate MEDIUM → HIGH after 96 hours
        List<Complaint> oldMedComplaints = complaintRepository
                .findByStatusAndCreatedAtBefore(ComplaintStatus.OPEN, LocalDateTime.now().minusHours(96));

        for (Complaint complaint : oldMedComplaints) {
            if (complaint.getPriority() == ComplaintPriority.MEDIUM) {
                complaint.setPriority(ComplaintPriority.HIGH);
                complaintRepository.save(complaint);
                logAutomation(complaint, "PRIORITY_ESCALATED",
                        "Auto-escalated from MEDIUM to HIGH (open for 96+ hours)");
            }
        }

        // Escalate HIGH → CRITICAL after 168 hours (7 days)
        List<Complaint> oldHighComplaints = complaintRepository
                .findByStatusAndCreatedAtBefore(ComplaintStatus.OPEN, LocalDateTime.now().minusHours(168));

        for (Complaint complaint : oldHighComplaints) {
            if (complaint.getPriority() == ComplaintPriority.HIGH) {
                complaint.setPriority(ComplaintPriority.CRITICAL);
                complaintRepository.save(complaint);
                logAutomation(complaint, "PRIORITY_ESCALATED",
                        "Auto-escalated from HIGH to CRITICAL (open for 7+ days)");
            }
        }
    }

    /**
     * Auto-assign unassigned complaints to matching staff.
     * Runs every 30 minutes.
     */
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void autoAssignStaff() {
        log.info("Running auto-assignment check...");

        List<Complaint> unassigned = complaintRepository
                .findByStatusAndCreatedAtBefore(ComplaintStatus.OPEN, LocalDateTime.now().minusMinutes(30));

        for (Complaint complaint : unassigned) {
            if (complaint.getAssignedStaff() != null) continue;

            StaffSpecialization spec = CATEGORY_TO_SPEC.getOrDefault(
                    complaint.getCategory(), StaffSpecialization.GENERAL);

            List<User> matchingStaff = userRepository
                    .findBySocietyIdAndRoleAndStaffSpecialization(
                            complaint.getSociety().getId(), UserRole.STAFF, spec);

            if (!matchingStaff.isEmpty()) {
                // Simple round-robin: pick the first available staff
                User staff = matchingStaff.get(0);
                complaint.setAssignedStaff(staff);
                complaint.setStatus(ComplaintStatus.IN_PROGRESS);

                // Set expected completion based on priority
                int hoursToComplete = switch (complaint.getPriority()) {
                    case CRITICAL -> 4;
                    case HIGH -> 24;
                    case MEDIUM -> 72;
                    case LOW -> 168;
                };
                complaint.setExpectedCompletionDate(LocalDateTime.now().plusHours(hoursToComplete));

                complaintRepository.save(complaint);
                logAutomation(complaint, "AUTO_ASSIGNED",
                        "Auto-assigned to " + staff.getFullName() + " (specialization: " + spec + ")");
            }
        }
    }

    /**
     * Check for overdue complaints and flag them.
     * Runs every 2 hours.
     */
    @Scheduled(fixedRate = 7200000)
    @Transactional
    public void checkOverdueComplaints() {
        log.info("Running overdue check...");

        List<Complaint> overdue = complaintRepository.findOverdueComplaints(LocalDateTime.now());

        for (Complaint complaint : overdue) {
            if (complaint.getPriority() != ComplaintPriority.CRITICAL) {
                ComplaintPriority oldPriority = complaint.getPriority();
                complaint.setPriority(ComplaintPriority.CRITICAL);
                complaintRepository.save(complaint);
                logAutomation(complaint, "OVERDUE_ESCALATED",
                        "Overdue! Priority escalated from " + oldPriority + " to CRITICAL. " +
                                "Expected completion was: " + complaint.getExpectedCompletionDate());
            }
        }
    }

    private void logAutomation(Complaint complaint, String action, String details) {
        // Use the complaint user as the actor for system-generated logs
        ActivityLog logEntry = ActivityLog.builder()
                .complaint(complaint)
                .actor(complaint.getUser())
                .action(action)
                .details("[SYSTEM] " + details)
                .build();
        activityLogRepository.save(logEntry);
        log.info("Automation: {} - Complaint #{} - {}", action, complaint.getId(), details);
    }
}
