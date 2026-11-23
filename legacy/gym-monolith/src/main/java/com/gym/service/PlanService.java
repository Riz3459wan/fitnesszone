package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.MembershipPlan;
import com.gym.repository.MembershipPlanRepository;

import jakarta.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PlanService {

    @Autowired
    private MembershipPlanRepository planRepository;

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    @Cacheable(value = "plans", key = "T(com.gym.config.TenantContext).getCurrentGymId()")
    public List<MembershipPlan> getAllPlans() {
        Long gymId = getCurrentGymId();
        if (gymId == null) {
            return new ArrayList<>();
        }
        return planRepository.findByGymId(gymId);
    }

    public MembershipPlan getPlanById(Long id) {
        Long gymId = getCurrentGymId();
        if (gymId == null) {
            return null;
        }
        MembershipPlan plan = planRepository.findById(id).orElse(null);
        if (plan != null && gymId.equals(plan.getGymId())) {
            return plan;
        }
        return null;
    }

    @Transactional
    @CacheEvict(value = "plans", key = "T(com.gym.config.TenantContext).getCurrentGymId()")
    public MembershipPlan createPlan(MembershipPlan plan) {
        plan.setGymId(getCurrentGymId());
        plan.setUserId(getCurrentUserId());
        return planRepository.save(plan);
    }

    @Transactional
    @CacheEvict(value = "plans", key = "T(com.gym.config.TenantContext).getCurrentGymId()")
    public MembershipPlan updatePlan(Long id, MembershipPlan planDetails) {
        Long gymId = getCurrentGymId();
        if (gymId == null) {
            return null;
        }
        MembershipPlan plan = planRepository.findById(id).orElse(null);
        if (plan != null && gymId.equals(plan.getGymId())) {
            plan.setName(planDetails.getName());
            plan.setPrice(planDetails.getPrice());
            plan.setDuration(planDetails.getDuration());
            plan.setFeatures(planDetails.getFeatures());
            return planRepository.save(plan);
        }
        return null;
    }

    @Transactional
    @CacheEvict(value = "plans", key = "T(com.gym.config.TenantContext).getCurrentGymId()")
    public void deletePlan(Long id) {
        Long gymId = getCurrentGymId();
        if (gymId == null) {
            return;
        }
        MembershipPlan plan = planRepository.findById(id).orElse(null);
        if (plan != null && gymId.equals(plan.getGymId())) {
            planRepository.deleteById(id);
        }
    }
}