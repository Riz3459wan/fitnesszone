package com.gym.controller;

import com.gym.model.Attendance;
import com.gym.service.AttendanceService;
import com.gym.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    
    @Autowired
    private AttendanceService attendanceService;
    
    @GetMapping
    public ResponseEntity<ApiResponse> getTodayAttendance() {
        List<Map<String, Object>> attendance = attendanceService.getAllAttendanceWithMemberDetails();
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendance));
    }
    
    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse> getAttendanceByDate(@PathVariable String date) {
        LocalDate attendanceDate = LocalDate.parse(date);
        List<Map<String, Object>> attendance = attendanceService.getAttendanceWithMemberDetailsByDate(attendanceDate);
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved successfully", attendance));
    }
    
    @PostMapping("/checkin/{memberId}")
    public ResponseEntity<ApiResponse> checkIn(@PathVariable Long memberId) {
        Attendance attendance = attendanceService.checkIn(memberId);
        if (attendance != null) {
            return ResponseEntity.ok(ApiResponse.success("Checked in successfully", attendance));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to check in"));
    }
    
    @PostMapping("/checkout/{memberId}")
    public ResponseEntity<ApiResponse> checkOut(@PathVariable Long memberId) {
        Attendance attendance = attendanceService.checkOut(memberId);
        if (attendance != null) {
            return ResponseEntity.ok(ApiResponse.success("Checked out successfully", attendance));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to check out"));
    }
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> getAttendanceStats(@RequestParam(required = false) String startDate, @RequestParam(required = false) String endDate) {
        Map<String, Object> stats;
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            stats = attendanceService.getAttendanceStatsByDateRange(start, end);
        } else {
            stats = attendanceService.getAttendanceStats();
        }
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved successfully", stats));
    }
    
    @GetMapping("/export")
    public ResponseEntity<ApiResponse> exportAttendance() {
        List<Map<String, Object>> exportData = attendanceService.getExportData();
        return ResponseEntity.ok(ApiResponse.success("Attendance export data retrieved", exportData));
    }
}