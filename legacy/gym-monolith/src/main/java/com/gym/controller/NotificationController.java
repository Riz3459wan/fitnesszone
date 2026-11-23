package com.gym.controller;

import com.gym.dto.ApiResponse;
import com.gym.model.Notification;
import com.gym.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    @Autowired
    private NotificationService notificationService;
    
    @GetMapping
    public ResponseEntity<ApiResponse> getAllNotifications() {
        List<Map<String, Object>> notifications = notificationService.getAllNotifications();
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved successfully", notifications));
    }
    
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("count", count)));
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read", null));
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(ApiResponse.success("Notification deleted successfully", null));
    }
}