package com.gym.repository;

import com.gym.model.Member;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    List<Member> findByGymId(Long gymId);

    List<Member> findByUserId(Long userId);

    Optional<Member> findByIdAndGymId(Long id, Long gymId);

    long countByGymId(Long gymId);

    long countByGymIdAndJoinDateBefore(Long gymId, LocalDate date);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.gymId = :gymId AND m.membershipType IS NOT NULL AND m.membershipType <> ''")
    long countByGymIdAndMembershipTypeIsNotNull(@Param("gymId") Long gymId);

    @Query("SELECT COUNT(m) FROM Member m WHERE m.gymId = :gymId AND m.membershipType IS NOT NULL AND m.membershipType <> '' AND m.joinDate < :date")
    long countByGymIdAndMembershipTypeIsNotNullAndJoinDateBefore(@Param("gymId") Long gymId, @Param("date") LocalDate date);

    List<Member> findTop5ByGymIdOrderByJoinDateDesc(Long gymId);

    @Query("SELECT m FROM Member m WHERE m.gymId = :gymId AND (LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Member> searchMembers(@Param("gymId") Long gymId, @Param("search") String search);

    @Query("SELECT m FROM Member m WHERE m.gymId = :gymId AND m.joinDate BETWEEN :startDate AND :endDate")
    List<Member> findByGymIdAndJoinDateBetween(@Param("gymId") Long gymId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT m FROM Member m WHERE m.gymId = :gymId AND m.planId = :planId")
    List<Member> findByGymIdAndPlanId(@Param("gymId") Long gymId, @Param("planId") Long planId);

    Optional<Member> findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDesc(Long gymId, String prefix);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM Member m WHERE m.gymId = :gymId AND m.registrationNumber LIKE CONCAT(:prefix, '%') ORDER BY m.registrationNumber DESC")
    Optional<Member> findFirstByGymIdAndRegistrationNumberStartingWithOrderByRegistrationNumberDescForUpdate(
            @Param("gymId") Long gymId,
            @Param("prefix") String prefix);
}