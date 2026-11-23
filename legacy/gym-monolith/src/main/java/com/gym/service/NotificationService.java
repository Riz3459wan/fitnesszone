package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Notification;
import com.gym.repository.NotificationRepository;
import com.gym.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SettingsRepository settingsRepository;

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    private boolean isEnabled(Long gymId, String key) {
        return settingsRepository.findByGymIdAndSettingKey(gymId, key)
                .map(s -> !"false".equalsIgnoreCase(s.getSettingValue()))
                .orElse(true);
    }

    public List<Map<String, Object>> getAllNotifications() {
        Long gymId = getCurrentGymId();
        Long userId = getCurrentUserId();
        List<Notification> notifications;

        if (userId != null) {
            notifications = notificationRepository.findByGymIdAndUserIdOrderByCreatedAtDesc(gymId, userId);
        } else {
            notifications = notificationRepository.findByGymIdOrderByCreatedAtDesc(gymId);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, hh:mm a");

        for (Notification notification : notifications) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", notification.getId());
            item.put("type", notification.getType());
            item.put("title", notification.getTitle());
            item.put("message", notification.getMessage());
            item.put("read", notification.getRead());
            item.put("time", notification.getCreatedAt().format(formatter));
            item.put("createdAt", notification.getCreatedAt().toString());
            item.put("referenceId", notification.getReferenceId());
            result.add(item);
        }

        return result;
    }

    public long getUnreadCount() {
        Long gymId = getCurrentGymId();
        if (!isEnabled(gymId, "inAppNotifications")) return 0L;
        return notificationRepository.countUnreadByGymId(gymId);
    }

    @Transactional
    public void markAsRead(Long id) {
        Long gymId = getCurrentGymId();
        notificationRepository.markAsRead(gymId, id);
    }

    @Transactional
    public void markAllAsRead() {
        Long gymId = getCurrentGymId();
        notificationRepository.markAllAsRead(gymId);
    }

    @Transactional
    public void deleteNotification(Long id) {
        Long gymId = getCurrentGymId();
        notificationRepository.deleteByGymIdAndId(gymId, id);
    }

    @Transactional
    public void createNotification(Long gymId, Long userId, String type, String title, String message, Long referenceId) {
        if (!isEnabled(gymId, "inAppNotifications")) return;

        Notification notification = new Notification();
        notification.setGymId(gymId);
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notificationRepository.save(notification);
    }

    @Transactional
    public void createPaymentNotification(Long gymId, Long userId, String memberName, Double amount, Long paymentId) {
        if (!isEnabled(gymId, "paymentAlerts")) return;
        createNotification(gymId, userId, "payment", "Payment Received",
                String.format("%s made a payment of \u20b9%.0f", memberName, amount), paymentId);
    }

    @Transactional
    public void createAttendanceNotification(Long gymId, Long userId, String memberName, Long attendanceId) {
        if (!isEnabled(gymId, "attendanceAlerts")) return;
        createNotification(gymId, userId, "attendance", "Member Checked In",
                String.format("%s checked into the gym", memberName), attendanceId);
    }

    @Transactional
    public void createMemberNotification(Long gymId, Long userId, String memberName, Long memberId) {
        if (!isEnabled(gymId, "newMemberAlerts")) return;
        createNotification(gymId, userId, "member", "New Member Joined",
                String.format("%s joined as a new member", memberName), memberId);
    }
}