package com.gym.controller;

import com.gym.model.DashboardStats;
import com.gym.model.RevenueData;
import com.gym.service.DashboardService;
import com.gym.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    
    @Autowired
    private DashboardService dashboardService;
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> getStats() {
        DashboardStats stats = dashboardService.getStats();
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved successfully", stats));
    }
    
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse> getRevenueData() {
        List<RevenueData> revenueData = dashboardService.getRevenueData();
        return ResponseEntity.ok(ApiResponse.success("Revenue data retrieved successfully", revenueData));
    }
    
    @GetMapping("/recent-activities")
    public ResponseEntity<ApiResponse> getRecentActivities() {
        List<Map<String, Object>> activities = dashboardService.getRecentActivities();
        return ResponseEntity.ok(ApiResponse.success("Recent activities retrieved successfully", activities));
    }
}