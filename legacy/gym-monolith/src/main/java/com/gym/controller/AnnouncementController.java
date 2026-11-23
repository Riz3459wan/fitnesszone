package com.gym.controller;

import com.gym.model.Announcement;
import com.gym.service.AnnouncementService;
import com.gym.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getAllAnnouncements() {
        List<Announcement> announcements = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(ApiResponse.success("Announcements retrieved successfully", announcements));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getAnnouncementById(@PathVariable Long id) {
        Announcement announcement = announcementService.getAnnouncementById(id);
        if (announcement != null) {
            return ResponseEntity.ok(ApiResponse.success("Announcement found", announcement));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Announcement not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> createAnnouncement(@RequestBody Announcement announcement) {
        Announcement saved = announcementService.createAnnouncement(announcement);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement created successfully", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> updateAnnouncement(@PathVariable Long id, @RequestBody Announcement announcement) {
        Announcement updated = announcementService.updateAnnouncement(id, announcement);
        if (updated != null) {
            return ResponseEntity.ok(ApiResponse.success("Announcement updated successfully", updated));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Announcement not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> deleteAnnouncement(@PathVariable Long id) {
        announcementService.deleteAnnouncement(id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> togglePin(@PathVariable Long id) {
        Announcement updated = announcementService.togglePin(id);
        if (updated != null) {
            return ResponseEntity.ok(ApiResponse.success("Pin status updated", updated));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Announcement not found"));
    }
}