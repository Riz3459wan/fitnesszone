package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Gym;
import com.gym.model.Member;
import com.gym.model.MembershipPlan;
import com.gym.repository.GymRepository;
import com.gym.repository.MemberRepository;
import com.gym.repository.MembershipPlanRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MemberService")
class MemberServiceTest {

    @Mock private MemberRepository memberRepository;
    @Mock private MembershipPlanRepository planRepository;
    @Mock private NotificationService notificationService;
    @Mock private GymRepository gymRepository;

    private MemberService memberService;

    private static final Long GYM_A = 1L;
    private static final Long GYM_B = 2L;

    @BeforeEach
    void setUp() {
        memberService = new MemberService(memberRepository, planRepository, notificationService, gymRepository);
        TenantContext.setCurrentGymId(GYM_A);
        TenantContext.setCurrentUserId(10L);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Member member(Long id, Long gymId, String name) {
        Member m = new Member();
        m.setId(id);
        m.setGymId(gymId);
        m.setName(name);
        m.setEmail(name.toLowerCase().replace(" ", "") + "@test.com");
        m.setPhone("9999900000");
        return m;
    }

    private MembershipPlan plan(Long id, Long gymId, String name) {
        MembershipPlan p = new MembershipPlan();
        p.setId(id);
        p.setGymId(gymId);
        p.setName(name);
        p.setPrice(999.0);
        return p;
    }

    @Nested
    @DisplayName("getAllMembers")
    class GetAllMembers {

        @Test
        @DisplayName("returns only members belonging to current gym")
        void returnsOnlyCurrentGymMembers() {
            List<Member> gymAMembers = List.of(member(1L, GYM_A, "Alice"), member(2L, GYM_A, "Bob"));
            when(memberRepository.findByGymId(GYM_A)).thenReturn(gymAMembers);
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of());

            List<Member> result = memberService.getAllMembers();

            assertThat(result).hasSize(2).extracting(Member::getName).containsExactly("Alice", "Bob");
            verify(memberRepository).findByGymId(GYM_A);
            verify(memberRepository, never()).findByGymId(GYM_B);
        }

        @Test
        @DisplayName("returns empty list when gym context is null")
        void noGymContext_returnsEmpty() {
            TenantContext.setCurrentGymId(null);
            assertThat(memberService.getAllMembers()).isEmpty();
            verify(memberRepository, never()).findByGymId(any());
        }

        @Test
        @DisplayName("enriches members with plan name in a single query — not N+1")
        void enrichesMembersWithSinglePlanQuery() {
            MembershipPlan gold = plan(100L, GYM_A, "Gold");
            Member m1 = member(1L, GYM_A, "Alice"); m1.setPlanId(100L);
            Member m2 = member(2L, GYM_A, "Bob");   m2.setPlanId(100L);

            when(memberRepository.findByGymId(GYM_A)).thenReturn(List.of(m1, m2));
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of(gold));

            List<Member> result = memberService.getAllMembers();

            assertThat(result).allSatisfy(m -> assertThat(m.getMembershipType()).isEqualTo("Gold"));
            verify(planRepository, times(1)).findByGymId(GYM_A);
        }
    }

    @Nested
    @DisplayName("getMemberById — tenant isolation")
    class GetMemberById {

        @Test
        @DisplayName("returns member when it belongs to current gym")
        void memberBelongsToGym_returnsIt() {
            Member m = member(1L, GYM_A, "Alice");
            when(memberRepository.findById(1L)).thenReturn(Optional.of(m));
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of());

            assertThat(memberService.getMemberById(1L)).isEqualTo(m);
        }

        @Test
        @DisplayName("returns null when member belongs to a different gym — tenant isolation enforced")
        void memberBelongsToDifferentGym_returnsNull() {
            Member m = member(1L, GYM_B, "Eve");
            when(memberRepository.findById(1L)).thenReturn(Optional.of(m));

            assertThat(memberService.getMemberById(1L)).isNull();
            verify(memberRepository, never()).save(any());
        }

        @Test
        @DisplayName("returns null when member does not exist")
        void memberNotFound_returnsNull() {
            when(memberRepository.findById(99L)).thenReturn(Optional.empty());
            assertThat(memberService.getMemberById(99L)).isNull();
        }
    }

    @Nested
    @DisplayName("deleteMember")
    class DeleteMember {

        @Test
        @DisplayName("returns true and deletes when member belongs to current gym")
        void ownMember_deletesAndReturnsTrue() {
            Member m = member(1L, GYM_A, "Alice");
            when(memberRepository.findById(1L)).thenReturn(Optional.of(m));

            assertThat(memberService.deleteMember(1L)).isTrue();
            verify(memberRepository).deleteById(1L);
        }

        @Test
        @DisplayName("returns false and does NOT delete when member belongs to another gym")
        void otherGymMember_returnsFalseNoDelete() {
            Member m = member(1L, GYM_B, "Eve");
            when(memberRepository.findById(1L)).thenReturn(Optional.of(m));

            assertThat(memberService.deleteMember(1L)).isFalse();
            verify(memberRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("returns false when member does not exist")
        void nonExistentMember_returnsFalse() {
            when(memberRepository.findById(99L)).thenReturn(Optional.empty());
            assertThat(memberService.deleteMember(99L)).isFalse();
        }
    }

    @Nested
    @DisplayName("createMember")
    class CreateMember {

        @Test
        @DisplayName("assigns gymId and userId from TenantContext")
        void setsGymIdFromContext() {
            Member input = member(null, null, "New Guy");
            Gym gym = new Gym(); gym.setId(GYM_A); gym.setSubdomain("alpha");
            when(gymRepository.findById(GYM_A)).thenReturn(Optional.of(gym));
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of());
            when(memberRepository.findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDesc(
                    eq(GYM_A), anyString())).thenReturn(Optional.empty());
            when(memberRepository.save(any())).thenAnswer(inv -> {
                Member m = inv.getArgument(0); m.setId(1L); return m;
            });

            Member saved = memberService.createMember(input);

            assertThat(saved.getGymId()).isEqualTo(GYM_A);
            assertThat(saved.getUserId()).isEqualTo(10L);
            assertThat(saved.getRegistrationNumber()).isEqualTo("alpha-001");
        }

        @Test
        @DisplayName("resolves planId from membershipType name when planId is null")
        void resolvesPlanIdFromName() {
            MembershipPlan gold = plan(100L, GYM_A, "Gold");
            Member input = member(null, null, "Alice");
            input.setMembershipType("Gold");

            Gym gym = new Gym(); gym.setId(GYM_A); gym.setSubdomain("alpha");
            when(gymRepository.findById(GYM_A)).thenReturn(Optional.of(gym));
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of(gold));
            when(memberRepository.findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDesc(
                    eq(GYM_A), anyString())).thenReturn(Optional.empty());
            when(memberRepository.save(any())).thenAnswer(inv -> {
                Member m = inv.getArgument(0); m.setId(1L); return m;
            });

            Member saved = memberService.createMember(input);

            assertThat(saved.getPlanId()).isEqualTo(100L);
        }

        @Test
        @DisplayName("registration numbers increment correctly for existing members")
        void registrationNumberIncrements() {
            Gym gym = new Gym(); gym.setId(GYM_A); gym.setSubdomain("beta");
            Member existing = member(5L, GYM_A, "Old"); existing.setRegistrationNumber("beta-003");

            when(gymRepository.findById(GYM_A)).thenReturn(Optional.of(gym));
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of());
            when(memberRepository.findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDesc(
                    eq(GYM_A), eq("beta-"))).thenReturn(Optional.of(existing));
            when(memberRepository.save(any())).thenAnswer(inv -> {
                Member m = inv.getArgument(0); m.setId(6L); return m;
            });

            Member saved = memberService.createMember(member(null, null, "New"));
            assertThat(saved.getRegistrationNumber()).isEqualTo("beta-004");
        }
    }

    @Nested
    @DisplayName("searchMembers")
    class SearchMembers {

        @Test
        @DisplayName("passes gymId from context to repository")
        void passesGymIdToRepo() {
            when(memberRepository.searchMembers(GYM_A, "alice")).thenReturn(List.of());
            when(planRepository.findByGymId(GYM_A)).thenReturn(List.of());

            memberService.searchMembers("alice");

            verify(memberRepository).searchMembers(GYM_A, "alice");
        }
    }
}