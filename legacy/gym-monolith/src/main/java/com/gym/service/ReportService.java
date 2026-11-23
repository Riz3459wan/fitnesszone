package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Attendance;
import com.gym.model.Member;
import com.gym.repository.AttendanceRepository;
import com.gym.repository.MemberRepository;
import com.gym.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMemberReport(LocalDate startDate, LocalDate endDate, Long memberId) {
        Long gymId = getCurrentGymId();
        List<Member> members;

        if (memberId != null) {
            Member m = memberRepository.findById(memberId).orElse(null);
            members = (m != null && gymId.equals(m.getGymId())) ? List.of(m) : List.of();
        } else {
            members = memberRepository.findByGymId(gymId).stream()
                    .filter(m -> m.getJoinDate() != null
                            && !m.getJoinDate().isBefore(startDate)
                            && !m.getJoinDate().isAfter(endDate))
                    .collect(Collectors.toList());
        }

        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Member member : members) {
            List<Attendance> attendances = attendanceRepository
                    .findByGymIdAndDateBetween(gymId, startDate, endDate).stream()
                    .filter(a -> a.getMemberId().equals(member.getId()))
                    .collect(Collectors.toList());

            long presentDays = attendances.stream().filter(a -> "Present".equals(a.getStatus())).count();

            List<Map<String, Object>> payments = paymentRepository
                    .findAllWithMemberByGymIdAndMemberId(gymId, member.getId());

            double totalPaid = payments.stream()
                    .filter(p -> "Paid".equals(p.get("status")))
                    .mapToDouble(p -> p.get("amount") instanceof Number ? ((Number) p.get("amount")).doubleValue() : 0)
                    .sum();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", member.getId());
            row.put("name", member.getName());
            row.put("email", member.getEmail());
            row.put("phone", member.getPhone());
            row.put("plan", member.getMembershipType());
            row.put("joinDate", member.getJoinDate());
            row.put("attendanceDays", presentDays);
            row.put("totalDays", totalDays);
            row.put("attendanceRate", totalDays > 0 ? Math.round(presentDays * 100.0 / totalDays) : 0);
            row.put("amountPaid", totalPaid);
            row.put("status", totalPaid > 0 ? "Active" : "Pending");
            rows.add(row);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalMembers", rows.size());
        summary.put("activeMembers", rows.stream().filter(r -> "Active".equals(r.get("status"))).count());
        summary.put("totalRevenue", rows.stream().mapToDouble(r -> ((Number) r.get("amountPaid")).doubleValue()).sum());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("rows", rows);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAttendanceReport(LocalDate startDate, LocalDate endDate, Long memberId) {
        Long gymId = getCurrentGymId();
        List<Attendance> attendances = attendanceRepository.findByGymIdAndDateBetween(gymId, startDate, endDate);

        if (memberId != null) {
            attendances = attendances.stream()
                    .filter(a -> memberId.equals(a.getMemberId()))
                    .collect(Collectors.toList());
        }

        List<Long> memberIds = attendances.stream().map(Attendance::getMemberId).distinct().collect(Collectors.toList());
        Map<Long, Member> memberMap = memberRepository.findAllById(memberIds).stream()
                .filter(m -> gymId.equals(m.getGymId()))
                .collect(Collectors.toMap(Member::getId, m -> m));

        List<Map<String, Object>> rows = attendances.stream().map(a -> {
            Member member = memberMap.get(a.getMemberId());
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("memberName", member != null ? member.getName() : "Unknown");
            row.put("memberId", a.getMemberId());
            row.put("date", a.getDate());
            row.put("checkIn", a.getCheckIn() != null ? a.getCheckIn() : "-");
            row.put("checkOut", a.getCheckOut() != null ? a.getCheckOut() : "-");
            row.put("status", a.getStatus());
            return row;
        }).collect(Collectors.toList());

        long presentCount = attendances.stream().filter(a -> "Present".equals(a.getStatus())).count();
        long totalDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRecords", rows.size());
        summary.put("presentCount", presentCount);
        summary.put("absentCount", rows.size() - presentCount);
        summary.put("attendanceRate", rows.size() > 0 ? Math.round(presentCount * 100.0 / rows.size()) : 0);
        summary.put("uniqueMembers", memberIds.size());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("rows", rows);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPaymentReport(LocalDate startDate, LocalDate endDate, Long memberId) {
        Long gymId = getCurrentGymId();
        List<Map<String, Object>> payments;

        if (memberId != null) {
            payments = paymentRepository.findAllWithMemberByGymIdAndMemberId(gymId, memberId).stream()
                    .filter(p -> {
                        Object pd = p.get("paymentDate");
                        if (pd instanceof LocalDate) {
                            LocalDate d = (LocalDate) pd;
                            return !d.isBefore(startDate) && !d.isAfter(endDate);
                        }
                        return true;
                    }).collect(Collectors.toList());
        } else {
            payments = paymentRepository.findAllWithMemberByGymIdAndDateRange(gymId, startDate, endDate);
        }

        double totalPaid = payments.stream()
                .filter(p -> "Paid".equals(p.get("status")))
                .mapToDouble(p -> p.get("amount") instanceof Number ? ((Number) p.get("amount")).doubleValue() : 0)
                .sum();

        double totalPending = payments.stream()
                .filter(p -> "Pending".equals(p.get("status")))
                .mapToDouble(p -> p.get("amount") instanceof Number ? ((Number) p.get("amount")).doubleValue() : 0)
                .sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalTransactions", payments.size());
        summary.put("totalPaid", totalPaid);
        summary.put("totalPending", totalPending);
        summary.put("paidCount", payments.stream().filter(p -> "Paid".equals(p.get("status"))).count());
        summary.put("pendingCount", payments.stream().filter(p -> "Pending".equals(p.get("status"))).count());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("rows", payments);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getRevenueReport(LocalDate startDate, LocalDate endDate) {
        Long gymId = getCurrentGymId();
        List<Map<String, Object>> payments = paymentRepository.findAllWithMemberByGymIdAndDateRange(gymId, startDate, endDate);

        double totalRevenue = payments.stream()
                .filter(p -> "Paid".equals(p.get("status")))
                .mapToDouble(p -> p.get("amount") instanceof Number ? ((Number) p.get("amount")).doubleValue() : 0)
                .sum();

        double avgTransaction = payments.isEmpty() ? 0 : totalRevenue / payments.size();

        Map<String, String> planRevenue = new LinkedHashMap<>();
        payments.stream()
                .filter(p -> "Paid".equals(p.get("status")) && p.get("plan") != null)
                .forEach(p -> {
                    String plan = p.get("plan").toString();
                    double amt = p.get("amount") instanceof Number ? ((Number) p.get("amount")).doubleValue() : 0;
                    planRevenue.merge(plan, String.valueOf(amt), (a, b) -> String.valueOf(Double.parseDouble(a) + Double.parseDouble(b)));
                });

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalTransactions", payments.size());
        summary.put("paidTransactions", payments.stream().filter(p -> "Paid".equals(p.get("status"))).count());
        summary.put("avgTransaction", Math.round(avgTransaction * 100.0) / 100.0);
        summary.put("revenueByPlan", planRevenue);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary", summary);
        result.put("rows", payments);
        result.put("startDate", startDate);
        result.put("endDate", endDate);
        return result;
    }
}