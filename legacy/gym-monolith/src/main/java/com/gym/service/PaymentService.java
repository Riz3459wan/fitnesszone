package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Payment;
import com.gym.model.Member;
import com.gym.repository.PaymentRepository;
import com.gym.repository.MemberRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository,
                          MemberRepository memberRepository,
                          NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.memberRepository = memberRepository;
        this.notificationService = notificationService;
    }

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    public List<Map<String, Object>> getAllPaymentsWithMemberDetails() {
        return paymentRepository.findAllWithMemberByGymId(getCurrentGymId());
    }

    public List<Map<String, Object>> getPaymentsByDateRange(LocalDate startDate, LocalDate endDate) {
        return paymentRepository.findAllWithMemberByGymIdAndDateRange(getCurrentGymId(), startDate, endDate);
    }

    public Map<String, Object> getPaymentWithMemberDetails(Long id) {
        return paymentRepository.findWithMemberByIdAndGymId(id, getCurrentGymId());
    }

    public List<Map<String, Object>> getPaymentsByMemberWithDetails(Long memberId) {
        return paymentRepository.findAllWithMemberByGymIdAndMemberId(getCurrentGymId(), memberId);
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        payment.setGymId(getCurrentGymId());
        payment.setUserId(getCurrentUserId());
        payment.setPaymentDate(LocalDate.now());
        Payment saved = paymentRepository.save(payment);

        if ("Paid".equals(payment.getStatus())) {
            memberRepository.findById(payment.getMemberId()).ifPresent(member ->
                notificationService.createPaymentNotification(
                    getCurrentGymId(), getCurrentUserId(), member.getName(), payment.getAmount(), saved.getId()
                )
            );
        }

        return saved;
    }

    @Transactional
    public Payment updatePayment(Long id, Payment paymentDetails) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (payment.getGymId().equals(getCurrentGymId())) {
                payment.setAmount(paymentDetails.getAmount());
                payment.setPlan(paymentDetails.getPlan());
                payment.setStatus(paymentDetails.getStatus());
                if (paymentDetails.getPaymentDate() != null) {
                    payment.setPaymentDate(paymentDetails.getPaymentDate());
                }
                Payment saved = paymentRepository.save(payment);

                if ("Paid".equals(payment.getStatus())) {
                    memberRepository.findById(payment.getMemberId()).ifPresent(member ->
                        notificationService.createPaymentNotification(
                            getCurrentGymId(), getCurrentUserId(), member.getName(), payment.getAmount(), saved.getId()
                        )
                    );
                }
                return saved;
            }
        }
        return null;
    }

    @Transactional
    public Payment updatePaymentStatus(Long id, String status) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (payment.getGymId().equals(getCurrentGymId())) {
                payment.setStatus(status);
                Payment saved = paymentRepository.save(payment);

                if ("Paid".equals(status)) {
                    memberRepository.findById(payment.getMemberId()).ifPresent(member ->
                        notificationService.createPaymentNotification(
                            getCurrentGymId(), getCurrentUserId(), member.getName(), payment.getAmount(), saved.getId()
                        )
                    );
                }
                return saved;
            }
        }
        return null;
    }

    @Transactional
    public void deletePayment(Long id) {
        paymentRepository.findById(id).ifPresent(p -> {
            if (p.getGymId().equals(getCurrentGymId())) {
                paymentRepository.deleteById(id);
            }
        });
    }

    public Map<String, Object> getPaymentSummary() {
        Long gymId = getCurrentGymId();
        LocalDate now = LocalDate.now();
        Map<String, Object> summary = new HashMap<>();

        Double totalRevenue = paymentRepository.sumPaidAmountByGymIdAndMonthAndYear(gymId, now.getMonthValue(), now.getYear());
        summary.put("totalRevenue", totalRevenue != null ? totalRevenue : 0.0);

        Double pendingAmount = paymentRepository.sumPendingAmountByGymId(gymId);
        summary.put("pendingAmount", pendingAmount != null ? pendingAmount : 0.0);

        Long paidCount  = paymentRepository.countPaidByGymId(gymId);
        Long totalCount = paymentRepository.countByGymId(gymId);
        double successRate = (totalCount != null && totalCount > 0)
            ? ((paidCount != null ? paidCount : 0) * 100.0 / totalCount) : 0;
        summary.put("successRate", Math.round(successRate));

        return summary;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findByGymId(getCurrentGymId());
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .filter(p -> p.getGymId().equals(getCurrentGymId()))
                .orElse(null);
    }

    public Double getTotalRevenue() {
        LocalDate now = LocalDate.now();
        Double total = paymentRepository.sumPaidAmountByGymIdAndMonthAndYear(getCurrentGymId(), now.getMonthValue(), now.getYear());
        return total != null ? total : 0.0;
    }

    public Double getPendingAmount() {
        Double pending = paymentRepository.sumPendingAmountByGymId(getCurrentGymId());
        return pending != null ? pending : 0.0;
    }

    public List<Payment> getPaymentsByMember(Long memberId) {
        return paymentRepository.findByGymIdAndMemberId(getCurrentGymId(), memberId);
    }

	public Payment createOnlinePayment(Long memberId, Double amount, String plan, String razorpayOrderId,
			String razorpayPaymentId, String razorpaySignature) {
		// TODO Auto-generated method stub
		return null;
	}
}