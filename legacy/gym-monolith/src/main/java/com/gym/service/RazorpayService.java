package com.gym.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class RazorpayService {

    private final RazorpayClient razorpayClient;
    private final String keySecret;
    private final String webhookSecret;

    public RazorpayService(RazorpayClient razorpayClient,
                           @Value("${razorpay.key.secret}") String keySecret,
                           @Value("${razorpay.webhook.secret}") String webhookSecret) {
        this.razorpayClient = razorpayClient;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
    }

    public Map<String, Object> createOrder(long amountInPaise, String currency) throws RazorpayException {
        JSONObject options = new JSONObject();
        options.put("amount", amountInPaise);
        options.put("currency", currency != null ? currency : "INR");
        options.put("payment_capture", 1);

        Order order = razorpayClient.orders.create(options);

        Map<String, Object> result = new HashMap<>();
        result.put("id", order.get("id"));
        result.put("amount", order.get("amount"));
        result.put("currency", order.get("currency"));
        return result;
    }

    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        try {
            String payload = orderId + "|" + paymentId;
            String generated = hmacSha256(payload, keySecret);
            return generated.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            String generated = hmacSha256(payload, webhookSecret);
            return generated.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }

    private String hmacSha256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}