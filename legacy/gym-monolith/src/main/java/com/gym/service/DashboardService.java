package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.DashboardStats;
import com.gym.model.RevenueData;
import com.gym.model.Attendance;
import com.gym.model.Member;
import com.gym.repository.MemberRepository;
import com.gym.repository.AttendanceRepository;
import com.gym.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Double revenueForMonth(Long gymId, LocalDate date) {
        return paymentRepository.sumPaidAmountByGymIdAndMonthAndYear(gymId, date.getMonthValue(), date.getYear());
    }

    @Cacheable(value = "dashboard-stats", key = "T(com.gym.config.TenantContext).getCurrentGymId()")
    public DashboardStats getStats() {
        DashboardStats stats = new DashboardStats();
        Long gymId = getCurrentGymId();
        LocalDate today = LocalDate.now();
        LocalDate firstDayCurrentMonth = today.withDayOfMonth(1);

        long totalMembers = memberRepository.countByGymId(gymId);
        stats.setTotalMembers(totalMembers);

        long previousMemberCount = memberRepository.countByGymIdAndJoinDateBefore(gymId, firstDayCurrentMonth);
        double membersChange = previousMemberCount > 0
                ? ((totalMembers - previousMemberCount) * 100.0 / previousMemberCount) : 0;
        stats.setMembersChange(Math.round(membersChange * 10) / 10.0);

        Long todayAttendance = attendanceRepository.countPresentByGymIdAndDate(gymId, today);
        stats.setTodayAttendance(todayAttendance != null ? todayAttendance : 0L);

        Long yesterdayAttendance = attendanceRepository.countPresentByGymIdAndDate(gymId, today.minusDays(1));
        double attendanceChange = (yesterdayAttendance != null && yesterdayAttendance > 0)
                ? ((todayAttendance - yesterdayAttendance) * 100.0 / yesterdayAttendance) : 0;
        stats.setAttendanceChange(Math.round(attendanceChange * 10) / 10.0);

        Double currentMonthRevenue = revenueForMonth(gymId, today);
        stats.setMonthlyRevenue(currentMonthRevenue != null ? currentMonthRevenue : 0.0);

        Double lastMonthRevenue = revenueForMonth(gymId, today.minusMonths(1));
        double revenueChange = (lastMonthRevenue != null && lastMonthRevenue > 0)
                ? (((currentMonthRevenue != null ? currentMonthRevenue : 0) - lastMonthRevenue) * 100.0 / lastMonthRevenue) : 0;
        stats.setRevenueChange(Math.round(revenueChange * 10) / 10.0);

//        long expiringCount = memberRepository.countByGymIdAndExpiryDateBetween(gymId, today, today.plusDays(7));
//        stats.setExpiringMemberships(expiringCount);

        return stats;
    }

    public List<RevenueData> getRevenueData() {
        Long gymId = getCurrentGymId();
        LocalDate today = LocalDate.now();
        List<RevenueData> revenueList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 5; i >= 0; i--) {
            LocalDate month = today.minusMonths(i);
            Double revenue = revenueForMonth(gymId, month);
            RevenueData data = new RevenueData();
            data.setMonth(month.format(formatter));
            data.setRevenue(revenue != null ? revenue : 0.0);
            revenueList.add(data);
        }

        return revenueList;
    }

    public List<Map<String, Object>> getRecentActivities() {
        Long gymId = getCurrentGymId();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> activities = new ArrayList<>();

        List<Member> recentMembers = memberRepository.findByGymIdAndJoinDateBetween(gymId, today.minusDays(7), today);
        for (Member m : recentMembers) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("type", "NEW_MEMBER");
            activity.put("description", m.getName() + " joined");
            activity.put("date", m.getJoinDate());
            activities.add(activity);
        }

        List<Attendance> todayAttendances = attendanceRepository.findByGymIdAndDate(gymId, today);
        for (Attendance a : todayAttendances) {
            memberRepository.findById(a.getMemberId()).ifPresent(member -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "ATTENDANCE");
                activity.put("description", member.getName() + " checked in");
                activity.put("date", today);
                activities.add(activity);
            });
        }

        activities.sort((a, b) -> {
            LocalDate dateA = (LocalDate) a.get("date");
            LocalDate dateB = (LocalDate) b.get("date");
            return dateB.compareTo(dateA);
        });

        return activities.stream().limit(10).collect(Collectors.toList());
    }
}