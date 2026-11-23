package com.gym.model;

public class DashboardStats {
    private Long totalMembers;
    private Double monthlyRevenue;
    private Long todayAttendance;
    private Long activeMemberships;
    private Double revenueChange;
    private Double attendanceChange;
    private Double membersChange;
    private Double activeChange;
    
    public DashboardStats() {}
    
    public DashboardStats(Long totalMembers, Double monthlyRevenue, Long todayAttendance, Long activeMemberships, 
                          Double revenueChange, Double attendanceChange, Double membersChange, Double activeChange) {
        this.totalMembers = totalMembers;
        this.monthlyRevenue = monthlyRevenue;
        this.todayAttendance = todayAttendance;
        this.activeMemberships = activeMemberships;
        this.revenueChange = revenueChange;
        this.attendanceChange = attendanceChange;
        this.membersChange = membersChange;
        this.activeChange = activeChange;
    }
    
    public Long getTotalMembers() {
        return totalMembers;
    }
    
    public void setTotalMembers(Long totalMembers) {
        this.totalMembers = totalMembers;
    }
    
    public Double getMonthlyRevenue() {
        return monthlyRevenue;
    }
    
    public void setMonthlyRevenue(Double monthlyRevenue) {
        this.monthlyRevenue = monthlyRevenue;
    }
    
    public Long getTodayAttendance() {
        return todayAttendance;
    }
    
    public void setTodayAttendance(Long todayAttendance) {
        this.todayAttendance = todayAttendance;
    }
    
    public Long getActiveMemberships() {
        return activeMemberships;
    }
    
    public void setActiveMemberships(Long activeMemberships) {
        this.activeMemberships = activeMemberships;
    }
    
    public Double getRevenueChange() {
        return revenueChange;
    }
    
    public void setRevenueChange(Double revenueChange) {
        this.revenueChange = revenueChange;
    }
    
    public Double getAttendanceChange() {
        return attendanceChange;
    }
    
    public void setAttendanceChange(Double attendanceChange) {
        this.attendanceChange = attendanceChange;
    }
    
    public Double getMembersChange() {
        return membersChange;
    }
    
    public void setMembersChange(Double membersChange) {
        this.membersChange = membersChange;
    }
    
    public Double getActiveChange() {
        return activeChange;
    }
    
    public void setActiveChange(Double activeChange) {
        this.activeChange = activeChange;
    }
}