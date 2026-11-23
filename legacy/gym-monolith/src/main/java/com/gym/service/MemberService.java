package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Member;
import com.gym.model.MembershipPlan;
import com.gym.model.Gym;
import com.gym.repository.MemberRepository;
import com.gym.repository.MembershipPlanRepository;
import com.gym.repository.GymRepository;
import jakarta.transaction.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final MembershipPlanRepository planRepository;
    private final NotificationService notificationService;
    private final GymRepository gymRepository;

    public MemberService(MemberRepository memberRepository,
                         MembershipPlanRepository planRepository,
                         NotificationService notificationService,
                         GymRepository gymRepository) {
        this.memberRepository = memberRepository;
        this.planRepository = planRepository;
        this.notificationService = notificationService;
        this.gymRepository = gymRepository;
    }

    private Long getCurrentGymId() { return TenantContext.getCurrentGymId(); }
    private Long getCurrentUserId() { return TenantContext.getCurrentUserId(); }

    public List<Member> getAllMembers() {
        Long gymId = getCurrentGymId();
        if (gymId == null) return new ArrayList<>();
        List<Member> members = memberRepository.findByGymId(gymId);
        enrichMembers(members, gymId);
        return members;
    }

    public List<Member> getMembersByDateRange(LocalDate startDate, LocalDate endDate) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return new ArrayList<>();
        List<Member> members = memberRepository.findByGymIdAndJoinDateBetween(gymId, startDate, endDate);
        enrichMembers(members, gymId);
        return members;
    }

    public Member getMemberById(Long id) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return null;
        Member member = memberRepository.findById(id).orElse(null);
        if (member != null && gymId.equals(member.getGymId())) {
            enrichMembers(List.of(member), gymId);
            return member;
        }
        return null;
    }

    @Transactional
    public Member createMember(Member member) {
        Long gymId = getCurrentGymId();
        if (gymId == null) {
            throw new IllegalStateException("No gym context found");
        }
        
        member.setGymId(gymId);
        member.setUserId(getCurrentUserId());
        member.setJoinDate(LocalDate.now());
        
        // Set default values for new fields
        member.setActive(true);
        member.setStatus("active");
        
        // Set expiry date (e.g., 30 days from join date)
        if (member.getExpiryDate() == null) {
            member.setExpiryDate(LocalDate.now().plusMonths(1));
        }

        Map<String, Long> planNameToId = planRepository.findByGymId(gymId).stream()
                .collect(Collectors.toMap(p -> p.getName().toLowerCase(), MembershipPlan::getId, (a, b) -> a));

        if (member.getPlanId() == null && member.getMembershipType() != null) {
            Long planId = planNameToId.get(member.getMembershipType().toLowerCase());
            if (planId != null) member.setPlanId(planId);
        }

        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new RuntimeException("Gym not found"));
        String prefix = gym.getSubdomain() + "-";

        // FIXED: Generate registration number safely
        String registrationNumber = generateRegistrationNumber(gymId, prefix);
        member.setRegistrationNumber(registrationNumber);

        try {
            Member saved = memberRepository.save(member);
            notificationService.createMemberNotification(gymId, getCurrentUserId(), member.getName(), saved.getId());
            enrichMembers(List.of(saved), gymId);
            return saved;
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Registration number conflict — please retry", e);
        }
    }

    private String generateRegistrationNumber(Long gymId, String prefix) {
        // FIXED: Simple and reliable registration number generation
        // Get all members for this gym
        List<Member> existingMembers = memberRepository.findByGymId(gymId);
        
        int maxNumber = 0;
        for (Member m : existingMembers) {
            String regNum = m.getRegistrationNumber();
            if (regNum != null && regNum.startsWith(prefix)) {
                try {
                    String numPart = regNum.substring(prefix.length());
                    int num = Integer.parseInt(numPart);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
                    // Ignore invalid registration numbers
                }
            }
        }
        
        int nextNumber = maxNumber + 1;
        return prefix + String.format("%03d", nextNumber);
    }

    @Transactional
    public Member updateMember(Long id, Member memberDetails) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return null;
        Member member = memberRepository.findById(id).orElse(null);
        if (member == null || !gymId.equals(member.getGymId())) return null;

        member.setName(memberDetails.getName());
        member.setEmail(memberDetails.getEmail());
        member.setPhone(memberDetails.getPhone());
        
        if (memberDetails.getStatus() != null) {
            member.setStatus(memberDetails.getStatus());
        }
        if (memberDetails.getActive() != null) {
            member.setActive(memberDetails.getActive());
        }
        if (memberDetails.getExpiryDate() != null) {
            member.setExpiryDate(memberDetails.getExpiryDate());
        }

        if (memberDetails.getPlanId() != null) {
            member.setPlanId(memberDetails.getPlanId());
            member.setMembershipType(null);
        } else if (memberDetails.getMembershipType() != null) {
            planRepository.findByGymId(gymId).stream()
                    .filter(p -> p.getName().equalsIgnoreCase(memberDetails.getMembershipType()))
                    .findFirst()
                    .ifPresentOrElse(
                            p -> { member.setPlanId(p.getId()); member.setMembershipType(null); },
                            () -> member.setMembershipType(memberDetails.getMembershipType())
                    );
        }

        Member saved = memberRepository.save(member);
        enrichMembers(List.of(saved), gymId);
        return saved;
    }

 // Add this method to your existing MemberService class

    @Transactional
    public Member updateMemberStatus(Long id, Boolean active) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return null;
        
        Member member = memberRepository.findById(id).orElse(null);
        if (member == null || !gymId.equals(member.getGymId())) return null;
        
        member.setActive(active);
        member.setStatus(active ? "active" : "inactive");
        
        Member saved = memberRepository.save(member);
        enrichMembers(List.of(saved), gymId);
        return saved;
    }
    
    @Transactional
    public boolean deleteMember(Long id) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return false;
        Member member = memberRepository.findById(id).orElse(null);
        if (member != null && gymId.equals(member.getGymId())) {
            memberRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<Member> searchMembers(String searchTerm) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return new ArrayList<>();
        List<Member> members = memberRepository.searchMembers(gymId, searchTerm);
        enrichMembers(members, gymId);
        return members;
    }

    private void enrichMembers(List<Member> members, Long gymId) {
        if (members.isEmpty()) return;
        Map<Long, String> planNames = planRepository.findByGymId(gymId).stream()
                .collect(Collectors.toMap(MembershipPlan::getId, MembershipPlan::getName));
        for (Member m : members) {
            if (m.getPlanId() != null) {
                String name = planNames.get(m.getPlanId());
                if (name != null) {
                    m.setMembershipPlanName(name);
                    m.setMembershipType(name);
                }
            }
        }
    }
}