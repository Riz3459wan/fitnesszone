package com.gym.service;

import com.gym.model.Gym;
import com.gym.repository.GymRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Service
public class SubscriptionService {

    private final GymRepository gymRepository;

    public SubscriptionService(GymRepository gymRepository) {
        this.gymRepository = gymRepository;
    }

    @Cacheable(value = "subscription-status", key = "#gymId")
    public boolean isGymActive(Long gymId) {
        Gym gym = gymRepository.findById(gymId).orElse(null);
        if (gym == null) return false;

        if ("TRIAL".equals(gym.getSubscriptionStatus())) {
            if (gym.getTrialEndDate() != null &&
                gym.getTrialEndDate().isBefore(LocalDate.now())) {
                gym.setSubscriptionStatus("EXPIRED");
                gymRepository.save(gym);
                return false;
            }
            return true;
        }

        return "ACTIVE".equals(gym.getSubscriptionStatus());
    }

    public void activateTrial(Long gymId) {
        Gym gym = gymRepository.findById(gymId).orElse(null);
        if (gym != null) {
            gym.setSubscriptionStatus("TRIAL");
            gym.setTrialEndDate(LocalDate.now().plusDays(14));
            gymRepository.save(gym);
        }
    }

    @CacheEvict(value = "subscription-status", key = "#gymId")
    public void activatePlan(Long gymId, String planId, String planName) {
        Gym gym = gymRepository.findById(gymId).orElse(null);
        if (gym != null) {
            gym.setSubscriptionStatus("ACTIVE");
            gym.setPlanId(planId);
            gym.setPlanName(planName);
            gym.setTrialEndDate(null);
            gymRepository.save(gym);
        }
    }
}