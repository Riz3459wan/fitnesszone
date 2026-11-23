package com.gym.controller;

import com.gym.dto.ApiResponse;
import com.gym.dto.RazorpayOrderRequest;
import com.gym.dto.RazorpayVerifyRequest;
import com.gym.model.Payment;
import com.gym.service.PaymentService;
import com.gym.service.RazorpayService;
import com.razorpay.RazorpayException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final RazorpayService razorpayService;

    public PaymentController(PaymentService paymentService,
                             RazorpayService razorpayService) {
        this.paymentService = paymentService;
        this.razorpayService = razorpayService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getAllPayments(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Map<String, Object>> payments;
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            payments = paymentService.getPaymentsByDateRange(start, end);
        } else {
            payments = paymentService.getAllPaymentsWithMemberDetails();
        }
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", payments));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getPaymentById(@PathVariable Long id) {
        Map<String, Object> payment = paymentService.getPaymentWithMemberDetails(id);
        if (payment != null) {
            return ResponseEntity.ok(ApiResponse.success("Payment found", payment));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Payment not found"));
    }

    @GetMapping("/member/{memberId}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getPaymentsByMember(@PathVariable Long memberId) {
        List<Map<String, Object>> payments = paymentService.getPaymentsByMemberWithDetails(memberId);
        return ResponseEntity.ok(ApiResponse.success("Payments retrieved successfully", payments));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> createPayment(@RequestBody Payment payment) {
        Payment savedPayment = paymentService.createPayment(payment);
        if (savedPayment != null) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Payment created successfully", savedPayment));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Failed to create payment"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> updatePayment(@PathVariable Long id,
                                                      @RequestBody Payment paymentDetails) {
        Payment updatedPayment = paymentService.updatePayment(id, paymentDetails);
        if (updatedPayment != null) {
            return ResponseEntity.ok(ApiResponse.success("Payment updated successfully", updatedPayment));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Payment not found"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> updatePaymentStatus(@PathVariable Long id,
                                                            @RequestParam String status) {
        Payment updatedPayment = paymentService.updatePaymentStatus(id, status);
        if (updatedPayment != null) {
            return ResponseEntity.ok(ApiResponse.success("Payment status updated successfully", updatedPayment));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Payment not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> deletePayment(@PathVariable Long id) {
        paymentService.deletePayment(id);
        return ResponseEntity.ok(ApiResponse.success("Payment deleted successfully", null));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getPaymentSummary() {
        Map<String, Object> summary = paymentService.getPaymentSummary();
        return ResponseEntity.ok(ApiResponse.success("Summary retrieved successfully", summary));
    }

    @PostMapping("/razorpay/create-order")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> createRazorpayOrder(@RequestBody RazorpayOrderRequest request) {
        try {
            Map<String, Object> order = razorpayService.createOrder(
                    request.getAmount(),
                    request.getCurrency()
            );
            return ResponseEntity.ok(ApiResponse.success("Order created", order));
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to create Razorpay order"));
        }
    }

    @PostMapping("/razorpay/verify")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> verifyRazorpayPayment(@RequestBody RazorpayVerifyRequest request) {
        try {
            Payment payment = paymentService.createOnlinePayment(
                    request.getMemberId(),
                    request.getAmount(),
                    request.getPlan(),
                    request.getRazorpayOrderId(),
                    request.getRazorpayPaymentId(),
                    request.getRazorpaySignature()
            );
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Payment verified and recorded", payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Payment verification failed"));
        }
    }
}