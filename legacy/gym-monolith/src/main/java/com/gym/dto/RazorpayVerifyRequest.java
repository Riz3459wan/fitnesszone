package com.gym.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RazorpayVerifyRequest {

    @JsonProperty("razorpay_order_id")
    private String razorpayOrderId;

    @JsonProperty("razorpay_payment_id")
    private String razorpayPaymentId;

    @JsonProperty("razorpay_signature")
    private String razorpaySignature;

    private Long memberId;
    private Double amount;
    private String plan;

    public RazorpayVerifyRequest() {}

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
}