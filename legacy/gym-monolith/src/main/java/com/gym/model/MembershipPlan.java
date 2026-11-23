package com.gym.model;

import jakarta.persistence.*;

@Entity
@Table(name = "membership_plans")
public class MembershipPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "gym_id")
    private Long gymId;
    
    @Column(name = "user_id")
    private Long userId;
    
    private String name;
    private Double price;
    private String duration;
    private String features;
    
    public MembershipPlan() {}
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getGymId() {
        return gymId;
    }
    
    public void setGymId(Long gymId) {
        this.gymId = gymId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Double getPrice() {
        return price;
    }
    
    public void setPrice(Double price) {
        this.price = price;
    }
    
    public String getDuration() {
        return duration;
    }
    
    public void setDuration(String duration) {
        this.duration = duration;
    }
    
    public String getFeatures() {
        return features;
    }
    
    public void setFeatures(String features) {
        this.features = features;
    }
}