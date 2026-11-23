package com.gym.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "members",
    indexes = {
        @Index(name = "idx_member_gym_id", columnList = "gym_id"),
        @Index(name = "idx_member_plan_id", columnList = "plan_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_member_phone_gym",
            columnNames = {"phone", "gym_id"}
        ),
        @UniqueConstraint(
            name = "uk_member_email_gym",
            columnNames = {"email", "gym_id"}
        )
    }
)
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "gym_id")
    private Long gymId;

    @Column(name = "registration_number")
    private String registrationNumber;

    private String name;
    private String email;
    private String phone;

    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "membership_type")
    private String membershipType;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    private String status;

    private Boolean active = true;

    @Transient
    private String membershipPlanName;

    public Member() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getGymId() { return gymId; }
    public void setGymId(Long gymId) { this.gymId = gymId; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getMembershipType() {
        if (membershipType == null && planId != null) {
            return membershipPlanName;
        }
        return membershipType;
    }
    public void setMembershipType(String membershipType) { this.membershipType = membershipType; }

    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public String getMembershipPlanName() { return membershipPlanName; }
    public void setMembershipPlanName(String membershipPlanName) { this.membershipPlanName = membershipPlanName; }
}