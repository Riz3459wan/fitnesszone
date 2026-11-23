package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Attendance;
import com.gym.model.Member;
import com.gym.repository.AttendanceRepository;
import com.gym.repository.MemberRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             MemberRepository memberRepository,
                             NotificationService notificationService) {
        this.attendanceRepository = attendanceRepository;
        this.memberRepository = memberRepository;
        this.notificationService = notificationService;
    }

    private Long getCurrentGymId() {
        return TenantContext.getCurrentGymId();
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    @Transactional
    public Attendance checkIn(Long memberId) {
        LocalDate today = LocalDate.now();
        Long gymId = getCurrentGymId();

        Optional<Attendance> existing = attendanceRepository.findByGymIdAndMemberIdAndDate(gymId, memberId, today);

        if (existing.isPresent()) {
            Attendance attendance = existing.get();
            if (attendance.getCheckIn() == null) {
                attendance.setCheckIn(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
                attendance.setStatus("Present");
                return attendanceRepository.save(attendance);
            }
            return attendance;
        }

        Attendance attendance = new Attendance();
        attendance.setGymId(gymId);
        attendance.setUserId(getCurrentUserId());
        attendance.setMemberId(memberId);
        attendance.setDate(today);
        attendance.setCheckIn(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
        attendance.setStatus("Present");

        try {
            Attendance saved = attendanceRepository.save(attendance);
            memberRepository.findById(memberId).ifPresent(member ->
                notificationService.createAttendanceNotification(gymId, getCurrentUserId(), member.getName(), saved.getId())
            );
            return saved;
        } catch (DataIntegrityViolationException e) {
            // Two concurrent check-ins for the same member hit the DB unique
            // constraint on (gym_id, member_id, date) — return the existing record.
            return attendanceRepository
                    .findByGymIdAndMemberIdAndDate(gymId, memberId, today)
                    .orElseThrow(() -> new IllegalStateException("Check-in conflict", e));
        }
    }

    @Transactional
    public Attendance checkOut(Long memberId) {
        LocalDate today = LocalDate.now();
        Long gymId = getCurrentGymId();

        Optional<Attendance> existing = attendanceRepository.findByGymIdAndMemberIdAndDate(gymId, memberId, today);

        if (existing.isPresent()) {
            Attendance attendance = existing.get();
            if (attendance.getCheckIn() != null) {
                attendance.setCheckOut(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")));
                return attendanceRepository.save(attendance);
            }
        }

        return null;
    }

    public List<Map<String, Object>> getAllAttendanceWithMemberDetails() {
        return getAttendanceWithMemberDetailsByDate(LocalDate.now());
    }

    public List<Map<String, Object>> getAttendanceWithMemberDetailsByDate(LocalDate date) {
        Long gymId = getCurrentGymId();
        List<Attendance> attendanceList = attendanceRepository.findByGymIdAndDate(gymId, date);
        List<Member> allMembers = memberRepository.findByGymId(gymId);

        Set<Long> attendedMemberIds = attendanceList.stream()
                .map(Attendance::getMemberId)
                .collect(Collectors.toSet());

        Map<Long, Attendance> attendanceByMemberId = attendanceList.stream()
                .collect(Collectors.toMap(Attendance::getMemberId, a -> a, (a1, a2) -> a1));

        List<Map<String, Object>> result = new ArrayList<>();

        for (Member member : allMembers) {
            Map<String, Object> record = new HashMap<>();
            record.put("memberId", member.getId());
            record.put("name", member.getName());
            record.put("email", member.getEmail());
            record.put("membershipType", member.getMembershipType());
            record.put("date", date);

            if (attendedMemberIds.contains(member.getId())) {
                Attendance att = attendanceByMemberId.get(member.getId());
                record.put("id", att.getId());
                record.put("checkIn", att.getCheckIn() != null ? att.getCheckIn() : "-");
                record.put("checkOut", att.getCheckOut() != null ? att.getCheckOut() : "-");
                record.put("status", att.getStatus());
            } else {
                record.put("id", null);
                record.put("checkIn", "-");
                record.put("checkOut", "-");
                record.put("status", "Absent");
            }

            result.add(record);
        }

        result.sort((a, b) -> {
            String statusA = (String) a.get("status");
            String statusB = (String) b.get("status");
            if (statusA.equals("Present") && !statusB.equals("Present")) return -1;
            if (!statusA.equals("Present") && statusB.equals("Present")) return 1;
            return ((String) a.get("name")).compareTo((String) b.get("name"));
        });

        return result;
    }

    public Map<String, Object> getAttendanceStats() {
        Long gymId = getCurrentGymId();
        LocalDate today = LocalDate.now();

        Long presentCount = attendanceRepository.countPresentByGymIdAndDate(gymId, today);
        if (presentCount == null) presentCount = 0L;

        long totalMembers = memberRepository.countByGymId(gymId);
        long absentCount = totalMembers - presentCount;
        double attendanceRate = totalMembers > 0 ? (presentCount * 100.0 / totalMembers) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("present", presentCount);
        stats.put("absent", absentCount);
        stats.put("total", totalMembers);
        stats.put("attendanceRate", Math.round(attendanceRate));

        return stats;
    }

    public List<Map<String, Object>> getExportData() {
        Long gymId = getCurrentGymId();
        List<Attendance> allAttendance = attendanceRepository.findByGymId(gymId);

        Set<Long> memberIds = allAttendance.stream().map(Attendance::getMemberId).collect(Collectors.toSet());
        Map<Long, Member> memberMap = memberRepository.findAllById(memberIds).stream()
                .filter(m -> gymId.equals(m.getGymId()))
                .collect(Collectors.toMap(Member::getId, m -> m));

        List<Map<String, Object>> exportList = new ArrayList<>();

        for (Attendance attendance : allAttendance) {
            Member member = memberMap.get(attendance.getMemberId());
            if (member != null) {
                Map<String, Object> record = new HashMap<>();
                record.put("memberName", member.getName());
                record.put("email", member.getEmail());
                record.put("phone", member.getPhone());
                record.put("membershipType", member.getMembershipType());
                record.put("date", attendance.getDate().toString());
                record.put("checkIn", attendance.getCheckIn() != null ? attendance.getCheckIn() : "-");
                record.put("checkOut", attendance.getCheckOut() != null ? attendance.getCheckOut() : "-");
                record.put("status", attendance.getStatus());
                exportList.add(record);
            }
        }

        exportList.sort((a, b) -> ((String) b.get("date")).compareTo((String) a.get("date")));

        return exportList;
    }

    public Map<String, Object> getAttendanceStatsByDateRange(LocalDate startDate, LocalDate endDate) {
        List<Attendance> attendanceList = attendanceRepository.findByGymIdAndDateBetween(getCurrentGymId(), startDate, endDate);

        long presentCount = attendanceList.stream().filter(a -> "Present".equals(a.getStatus())).count();

        Set<Long> uniqueMembers = attendanceList.stream().map(Attendance::getMemberId).collect(Collectors.toSet());
        long uniqueMemberCount = uniqueMembers.size();
        double attendanceRate = uniqueMemberCount > 0 ? (presentCount * 100.0 / uniqueMemberCount) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("present", presentCount);
        stats.put("absent", uniqueMemberCount - presentCount);
        stats.put("total", uniqueMemberCount);
        stats.put("attendanceRate", Math.round(attendanceRate));

        return stats;
    }
}