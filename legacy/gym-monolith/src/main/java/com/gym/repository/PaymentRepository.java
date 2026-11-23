package com.gym.repository;

import com.gym.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByGymId(Long gymId);

    List<Payment> findByGymIdAndMemberId(Long gymId, Long memberId);

    Optional<Payment> findByRazorpayOrderId(String razorpayOrderId);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.gymId = :gymId AND p.status = 'Paid' AND MONTH(p.paymentDate) = :month AND YEAR(p.paymentDate) = :year")
    Double sumPaidAmountByGymIdAndMonthAndYear(@Param("gymId") Long gymId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.gymId = :gymId AND p.status = 'Pending'")
    Double sumPendingAmountByGymId(@Param("gymId") Long gymId);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.gymId = :gymId AND p.status = 'Paid'")
    Long countPaidByGymId(@Param("gymId") Long gymId);

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.gymId = :gymId")
    Long countByGymId(@Param("gymId") Long gymId);

    @Query(value = """
        SELECT p.id, m.name as member, m.phone, p.amount, p.plan,
               p.payment_date as paymentDate, p.status,
               p.payment_method as paymentMethod,
               p.razorpay_payment_id as razorpayPaymentId
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE p.gym_id = :gymId
        ORDER BY p.payment_date DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findAllWithMemberByGymId(@Param("gymId") Long gymId);

    @Query(value = """
        SELECT p.id, m.name as member, m.phone, p.amount, p.plan,
               p.payment_date as paymentDate, p.status,
               p.payment_method as paymentMethod,
               p.razorpay_payment_id as razorpayPaymentId
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE p.gym_id = :gymId
          AND p.payment_date BETWEEN :startDate AND :endDate
        ORDER BY p.payment_date DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findAllWithMemberByGymIdAndDateRange(
            @Param("gymId") Long gymId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query(value = """
        SELECT p.id, m.name as member, m.phone, p.amount, p.plan,
               p.payment_date as paymentDate, p.status,
               p.payment_method as paymentMethod,
               p.razorpay_payment_id as razorpayPaymentId
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE p.id = :id AND p.gym_id = :gymId
        """, nativeQuery = true)
    Map<String, Object> findWithMemberByIdAndGymId(@Param("id") Long id, @Param("gymId") Long gymId);

    @Query(value = """
        SELECT p.id, m.name as member, m.phone, p.amount, p.plan,
               p.payment_date as paymentDate, p.status,
               p.payment_method as paymentMethod,
               p.razorpay_payment_id as razorpayPaymentId
        FROM payments p
        JOIN members m ON p.member_id = m.id
        WHERE p.gym_id = :gymId AND p.member_id = :memberId
        ORDER BY p.payment_date DESC
        """, nativeQuery = true)
    List<Map<String, Object>> findAllWithMemberByGymIdAndMemberId(
            @Param("gymId") Long gymId,
            @Param("memberId") Long memberId);
}