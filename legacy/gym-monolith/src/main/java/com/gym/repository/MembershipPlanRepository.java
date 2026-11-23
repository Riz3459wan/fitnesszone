package com.gym.repository;

import com.gym.model.MembershipPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findByGymId(Long gymId);
    List<MembershipPlan> findByUserId(Long userId);
}