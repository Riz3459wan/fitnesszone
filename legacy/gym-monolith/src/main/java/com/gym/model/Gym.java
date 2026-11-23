package com.gym.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "gyms")
public class Gym {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String subdomain;

    private String planId;
    private String planName;
    private String subscriptionStatus;
    private LocalDateTime trialStartedAt;
    private LocalDate trialEndDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Column(columnDefinition = "TEXT")
    private String settings;

    public Gym() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.subscriptionStatus = "TRIAL";
        this.trialStartedAt = LocalDateTime.now();
        this.trialEndDate = LocalDate.now().plusDays(14);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public String getPlanName() { return planName; }
    public void setPlanName(String planName) { this.planName = planName; }

    public String getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(String subscriptionStatus) { this.subscriptionStatus = subscriptionStatus; }

    public LocalDateTime getTrialStartedAt() { return trialStartedAt; }
    public void setTrialStartedAt(LocalDateTime trialStartedAt) { this.trialStartedAt = trialStartedAt; }

    public LocalDate getTrialEndDate() { return trialEndDate; }
    public void setTrialEndDate(LocalDate trialEndDate) { this.trialEndDate = trialEndDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }
}