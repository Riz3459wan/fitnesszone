package com.gym.controller;

import com.gym.config.TenantContext;
import com.gym.dto.ApiResponse;
import com.gym.dto.SubscriptionOrderRequest;
import com.gym.dto.SubscriptionVerifyRequest;
import com.gym.model.Gym;
import com.gym.repository.GymRepository;
import com.gym.service.RazorpayService;
import com.gym.service.SubscriptionService;
import com.razorpay.RazorpayException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final GymRepository gymRepository;
    private final RazorpayService razorpayService;

    private static final Map<String, Long> PLAN_PRICES = Map.of(
            "starter", 4900L,
            "professional", 9900L,
            "enterprise", 19900L
    );

    public SubscriptionController(SubscriptionService subscriptionService,
                                  GymRepository gymRepository,
                                  RazorpayService razorpayService) {
        this.subscriptionService = subscriptionService;
        this.gymRepository = gymRepository;
        this.razorpayService = razorpayService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getSubscriptionStatus() {
        Long gymId = TenantContext.getCurrentGymId();
        if (gymId == null) {
            return ResponseEntity.ok(ApiResponse.success("No gym context", null));
        }

        Gym gym = gymRepository.findById(gymId).orElse(null);
        if (gym == null) {
            return ResponseEntity.ok(ApiResponse.success("Gym not found", null));
        }

        Map<String, Object> status = new HashMap<>();
        status.put("status", gym.getSubscriptionStatus());
        status.put("planName", gym.getPlanName());
        status.put("trialEndDate", gym.getTrialEndDate());
        status.put("isActive", subscriptionService.isGymActive(gymId));

        return ResponseEntity.ok(ApiResponse.success("Subscription status", status));
    }

    @PostMapping("/activate")
    public ResponseEntity<ApiResponse> activatePlan(@RequestParam String planId,
                                                     @RequestParam String planName) {
        Long gymId = TenantContext.getCurrentGymId();
        if (gymId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("No gym context"));
        }

        subscriptionService.activatePlan(gymId, planId, planName);
        return ResponseEntity.ok(ApiResponse.success("Plan activated successfully", null));
    }

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<ApiResponse> createSubscriptionOrder(@RequestBody SubscriptionOrderRequest request) {
        Long priceInPaise = PLAN_PRICES.getOrDefault(request.getPlanId(), 0L);
        if (priceInPaise == 0L) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid plan"));
        }

        try {
            Map<String, Object> order = razorpayService.createOrder(priceInPaise, "INR");
            return ResponseEntity.ok(ApiResponse.success("Order created", order));
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create order"));
        }
    }

    @PostMapping("/razorpay/verify")
    public ResponseEntity<ApiResponse> verifySubscriptionPayment(@RequestBody SubscriptionVerifyRequest request) {
        boolean valid = razorpayService.verifyPaymentSignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Invalid payment signature"));
        }

        Long gymId = TenantContext.getCurrentGymId();
        if (gymId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("No gym context"));
        }

        subscriptionService.activatePlan(gymId, request.getPlanId(), request.getPlanName());
        return ResponseEntity.ok(ApiResponse.success("Subscription activated", null));
    }
}