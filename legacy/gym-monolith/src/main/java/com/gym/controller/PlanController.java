package com.gym.controller;

import com.gym.model.MembershipPlan;
import com.gym.service.PlanService;
import com.gym.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    @Autowired
    private PlanService planService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getAllPlans() {
        List<MembershipPlan> plans = planService.getAllPlans();
        return ResponseEntity.ok(ApiResponse.success("Plans retrieved successfully", plans));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getPlanById(@PathVariable Long id) {
        MembershipPlan plan = planService.getPlanById(id);
        if (plan != null) {
            return ResponseEntity.ok(ApiResponse.success("Plan found", plan));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Plan not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> createPlan(@RequestBody MembershipPlan plan) {
        MembershipPlan savedPlan = planService.createPlan(plan);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Plan created successfully", savedPlan));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> updatePlan(@PathVariable Long id, @RequestBody MembershipPlan plan) {
        MembershipPlan updatedPlan = planService.updatePlan(id, plan);
        if (updatedPlan != null) {
            return ResponseEntity.ok(ApiResponse.success("Plan updated successfully", updatedPlan));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Plan not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.success("Plan deleted successfully", null));
    }
}