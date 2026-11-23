package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Announcement;
import com.gym.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    public List<Announcement> getAllAnnouncements() {
        return announcementRepository.findByGymIdOrderByPinnedDescCreatedAtDesc(getCurrentGymId());
    }

    public Announcement getAnnouncementById(Long id) {
        return announcementRepository.findById(id).orElse(null);
    }

    @Transactional
    public Announcement createAnnouncement(Announcement announcement) {
        announcement.setGymId(getCurrentGymId());
        announcement.setUserId(getCurrentUserId());
        announcement.setCreatedAt(LocalDateTime.now());
        announcement.setUpdatedAt(LocalDateTime.now());
        
        if (Boolean.TRUE.equals(announcement.getPinned())) {
            announcementRepository.unpinAllForGym(getCurrentGymId());
        }
        
        return announcementRepository.save(announcement);
    }

    @Transactional
    public Announcement updateAnnouncement(Long id, Announcement announcementDetails) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement == null || !announcement.getGymId().equals(getCurrentGymId())) {
            return null;
        }
        
        announcement.setTitle(announcementDetails.getTitle());
        announcement.setContent(announcementDetails.getContent());
        announcement.setTargetAudience(announcementDetails.getTargetAudience());
        announcement.setPriority(announcementDetails.getPriority());
        announcement.setExpiresAt(announcementDetails.getExpiresAt());
        announcement.setUpdatedAt(LocalDateTime.now());
        
        boolean wasPinned = Boolean.TRUE.equals(announcement.getPinned());
        boolean willBePinned = Boolean.TRUE.equals(announcementDetails.getPinned());
        
        if (!wasPinned && willBePinned) {
            announcementRepository.unpinAllForGym(getCurrentGymId());
        }
        announcement.setPinned(announcementDetails.getPinned());
        
        return announcementRepository.save(announcement);
    }

    @Transactional
    public void deleteAnnouncement(Long id) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement != null && announcement.getGymId().equals(getCurrentGymId())) {
            announcementRepository.deleteById(id);
        }
    }

    @Transactional
    public Announcement togglePin(Long id) {
        Announcement announcement = announcementRepository.findById(id).orElse(null);
        if (announcement == null || !announcement.getGymId().equals(getCurrentGymId())) {
            return null;
        }
        
        if (Boolean.FALSE.equals(announcement.getPinned())) {
            announcementRepository.unpinAllForGym(getCurrentGymId());
            announcement.setPinned(true);
        } else {
            announcement.setPinned(false);
        }
        announcement.setUpdatedAt(LocalDateTime.now());
        return announcementRepository.save(announcement);
    }
}