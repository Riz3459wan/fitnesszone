package com.gym.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.model.Payment;
import com.gym.repository.GymRepository;
import com.gym.repository.PaymentRepository;
import com.gym.service.RazorpayService;
import com.gym.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhooks")
public class RazorpayWebhookController {

    private final RazorpayService razorpayService;
    private final PaymentRepository paymentRepository;
    private final SubscriptionService subscriptionService;
    private final GymRepository gymRepository;
    private final ObjectMapper objectMapper;

    public RazorpayWebhookController(RazorpayService razorpayService,
                                     PaymentRepository paymentRepository,
                                     SubscriptionService subscriptionService,
                                     GymRepository gymRepository,
                                     ObjectMapper objectMapper) {
        this.razorpayService = razorpayService;
        this.paymentRepository = paymentRepository;
        this.subscriptionService = subscriptionService;
        this.gymRepository = gymRepository;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/razorpay")
    public ResponseEntity<String> handleWebhook(
            HttpServletRequest request,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody byte[] rawBody) throws IOException {

        if (signature == null) {
            return ResponseEntity.badRequest().body("Missing signature");
        }

        String payload = new String(rawBody, StandardCharsets.UTF_8);

        if (!razorpayService.verifyWebhookSignature(payload, signature)) {
            return ResponseEntity.status(400).body("Invalid signature");
        }

        JsonNode root = objectMapper.readTree(payload);
        String event = root.path("event").asText();

        if ("payment.captured".equals(event)) {
            JsonNode paymentNode = root.path("payload").path("payment").path("entity");
            String orderId = paymentNode.path("order_id").asText();
            String paymentId = paymentNode.path("id").asText();
            String notes = paymentNode.path("notes").toString();

            Optional<Payment> existing = paymentRepository.findByRazorpayOrderId(orderId);
            if (existing.isEmpty()) {
                JsonNode notesNode = objectMapper.readTree(notes);
                String planId = notesNode.path("plan_id").asText(null);
                String planName = notesNode.path("plan_name").asText(null);

                if (planId != null && planName != null) {
                    gymRepository.findAll().stream()
                            .filter(g -> "TRIAL".equals(g.getSubscriptionStatus()) || "EXPIRED".equals(g.getSubscriptionStatus()))
                            .findFirst()
                            .ifPresent(gym -> subscriptionService.activatePlan(gym.getId(), planId, planName));
                }
            }
        }

        return ResponseEntity.ok("OK");
    }
}