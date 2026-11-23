package com.gym.dto;

public class SubscriptionOrderRequest {
    private String planId;
    private String planName;

    public SubscriptionOrderRequest() {}

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }
}