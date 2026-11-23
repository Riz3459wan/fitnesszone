package com.gym.controller;

import com.gym.dto.ApiResponse;
import com.gym.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/members")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getMemberReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long memberId) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        Map<String, Object> report = reportService.getMemberReport(start, end, memberId);
        return ResponseEntity.ok(ApiResponse.success("Member report generated", report));
    }

    @GetMapping("/attendance")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getAttendanceReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long memberId) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        Map<String, Object> report = reportService.getAttendanceReport(start, end, memberId);
        return ResponseEntity.ok(ApiResponse.success("Attendance report generated", report));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getPaymentReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long memberId) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        Map<String, Object> report = reportService.getPaymentReport(start, end, memberId);
        return ResponseEntity.ok(ApiResponse.success("Payment report generated", report));
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getRevenueReport(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now().withDayOfMonth(1);
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();
        Map<String, Object> report = reportService.getRevenueReport(start, end);
        return ResponseEntity.ok(ApiResponse.success("Revenue report generated", report));
    }
}