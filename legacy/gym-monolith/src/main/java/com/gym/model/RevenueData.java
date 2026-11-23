package com.gym.model;

public class RevenueData {
    private String month;
    private Double revenue;
    
    public RevenueData() {}
    
    public RevenueData(String month, Double revenue) {
        this.month = month;
        this.revenue = revenue;
    }
    
    public String getMonth() {
        return month;
    }
    
    public void setMonth(String month) {
        this.month = month;
    }
    
    public Double getRevenue() {
        return revenue;
    }
    
    public void setRevenue(Double revenue) {
        this.revenue = revenue;
    }
}