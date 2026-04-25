package com.societycms.service;

import com.societycms.dto.NotificationResponse;
import com.societycms.entity.Notification;
import com.societycms.entity.User;
import com.societycms.enums.UserRole;
import com.societycms.repository.NotificationRepository;
import com.societycms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(User user, String title, String message) {
        if (user == null) return;
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyAdmins(Long societyId, String title, String message) {
        userRepository.findBySocietyId(societyId).stream()
                .filter(u -> u.getRole() == UserRole.ADMIN || u.getRole() == UserRole.SECRETARY)
                .forEach(u -> createNotification(u, title, message));
    }

    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserId(userId, pageable)
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .isRead(n.isRead())
                        .createdAt(n.getCreatedAt())
                        .build());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getUser().getId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }
}
