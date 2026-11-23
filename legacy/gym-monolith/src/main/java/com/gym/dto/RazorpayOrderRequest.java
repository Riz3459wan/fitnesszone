package com.gym.dto;

public class RazorpayOrderRequest {
    private Long amount;
    private String currency;

    public RazorpayOrderRequest() {}

    public Long getAmount() { return amount; }
    public void setAmount(Long amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}