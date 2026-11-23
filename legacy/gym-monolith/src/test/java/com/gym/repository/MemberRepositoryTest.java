package com.gym.repository;

import com.gym.model.Gym;
import com.gym.model.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("MemberRepository")
class MemberRepositoryTest {

    @Autowired MemberRepository memberRepository;
    @Autowired GymRepository gymRepository;

    private Gym gymA, gymB;

    @BeforeEach
    void setUp() {
        gymA = savedGym("Alpha", "alpha");
        gymB = savedGym("Beta",  "beta");
    }

    private Gym savedGym(String name, String sub) {
        Gym g = new Gym(); g.setName(name); g.setSubdomain(sub);
        return gymRepository.save(g);
    }

    private Member savedMember(String name, String email, Long gymId, String regNum) {
        Member m = new Member();
        m.setName(name);
        m.setEmail(email);
        m.setPhone("9000000000");
        m.setGymId(gymId);
        m.setJoinDate(LocalDate.now());
        m.setRegistrationNumber(regNum);
        return memberRepository.save(m);
    }

    @Test
    @DisplayName("findByGymId returns only members for that gym")
    void findByGymId_isolatesPerTenant() {
        savedMember("Alice", "alice@a.com", gymA.getId(), "alpha-001");
        savedMember("Bob",   "bob@b.com",   gymB.getId(), "beta-001");

        List<Member> gymAMembers = memberRepository.findByGymId(gymA.getId());
        assertThat(gymAMembers).hasSize(1).extracting(Member::getName).containsOnly("Alice");
    }

    @Test
    @DisplayName("countByGymId counts only that gym's members")
    void countByGymId_countsCorrectly() {
        savedMember("Alice", "alice@a.com", gymA.getId(), "alpha-001");
        savedMember("Carl",  "carl@a.com",  gymA.getId(), "alpha-002");
        savedMember("Bob",   "bob@b.com",   gymB.getId(), "beta-001");

        assertThat(memberRepository.countByGymId(gymA.getId())).isEqualTo(2);
        assertThat(memberRepository.countByGymId(gymB.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("searchMembers finds by partial name, case-insensitive")
    void searchMembers_byName_caseInsensitive() {
        savedMember("Alice Wonder", "alice@a.com", gymA.getId(), "alpha-001");
        savedMember("Bob Smith",    "bob@a.com",   gymA.getId(), "alpha-002");
        savedMember("Alice Rival",  "ar@b.com",    gymB.getId(), "beta-001");

        List<Member> results = memberRepository.searchMembers(gymA.getId(), "alice");
        assertThat(results).hasSize(1).extracting(Member::getName).containsOnly("Alice Wonder");
    }

    @Test
    @DisplayName("searchMembers finds by partial email")
    void searchMembers_byEmail() {
        savedMember("Dave", "dave@alpha.com",   gymA.getId(), "alpha-001");
        savedMember("Eve",  "eve@other.com",    gymA.getId(), "alpha-002");

        List<Member> results = memberRepository.searchMembers(gymA.getId(), "alpha");
        assertThat(results).hasSize(1).extracting(Member::getName).containsOnly("Dave");
    }

    @Test
    @DisplayName("findByGymIdAndJoinDateBetween returns members within date range")
    void findByGymIdAndJoinDateBetween() {
        Member old = savedMember("Old", "old@a.com", gymA.getId(), "alpha-001");
        old.setJoinDate(LocalDate.of(2023, 1, 1));
        memberRepository.save(old);

        Member recent = savedMember("Recent", "recent@a.com", gymA.getId(), "alpha-002");
        recent.setJoinDate(LocalDate.of(2024, 6, 15));
        memberRepository.save(recent);

        List<Member> results = memberRepository.findByGymIdAndJoinDateBetween(
                gymA.getId(), LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31));

        assertThat(results).hasSize(1).extracting(Member::getName).containsOnly("Recent");
    }

    @Test
    @DisplayName("findFirstByGymIdAndRegistrationNumberStartingWith returns highest reg number")
    void findFirstByPrefix_returnsHighest() {
        savedMember("A", "a@a.com", gymA.getId(), "alpha-001");
        savedMember("B", "b@a.com", gymA.getId(), "alpha-002");
        savedMember("C", "c@a.com", gymA.getId(), "alpha-003");

        Optional<Member> found = memberRepository
                .findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDesc(
                        gymA.getId(), "alpha-");

        assertThat(found).isPresent();
        assertThat(found.get().getRegistrationNumber()).isEqualTo("alpha-003");
    }
}