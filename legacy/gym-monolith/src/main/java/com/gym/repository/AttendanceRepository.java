package com.gym.repository;

import com.gym.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByGymIdAndDate(Long gymId, LocalDate date);

    List<Attendance> findByGymIdAndMemberId(Long gymId, Long memberId);

    List<Attendance> findByGymId(Long gymId);

    Optional<Attendance> findByGymIdAndMemberIdAndDate(Long gymId, Long memberId, LocalDate date);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.gymId = :gymId AND a.date = :date AND a.status = 'Present'")
    Long countPresentByGymIdAndDate(@Param("gymId") Long gymId, @Param("date") LocalDate date);

    @Query("SELECT a FROM Attendance a WHERE a.gymId = :gymId AND a.memberId = :memberId ORDER BY a.date DESC")
    List<Attendance> findByGymIdAndMemberIdOrderByDateDesc(@Param("gymId") Long gymId, @Param("memberId") Long memberId);

    List<Attendance> findByGymIdAndUserId(Long gymId, Long userId);

    @Query("SELECT a FROM Attendance a WHERE a.gymId = :gymId AND a.date BETWEEN :startDate AND :endDate ORDER BY a.date DESC")
    List<Attendance> findByGymIdAndDateBetween(@Param("gymId") Long gymId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT a FROM Attendance a WHERE a.gymId = :gymId ORDER BY a.date DESC")
    List<Attendance> findRecentByGymId(@Param("gymId") Long gymId);
}