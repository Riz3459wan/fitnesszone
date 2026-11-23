package com.gym.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_email_gym", columnNames = {"email", "gym_id"}),
        @UniqueConstraint(name = "uk_username_gym", columnNames = {"username", "gym_id"})
    }
)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    private String password;

    @Column(nullable = false)
    private String email;

    private String role;
    private String fullName;
    private String phone;
    private Boolean active;

    @Column(name = "gym_id")
    private Long gymId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "token_version", nullable = false)
    private Long tokenVersion = 0L;

    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;

    @Column(name = "account_locked_until")
    private LocalDateTime accountLockedUntil;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public Long getGymId() { return gymId; }
    public void setGymId(Long gymId) { this.gymId = gymId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public Long getTokenVersion() { return tokenVersion; }
    public void setTokenVersion(Long tokenVersion) { this.tokenVersion = tokenVersion; }

    public Integer getFailedLoginAttempts() { return failedLoginAttempts; }
    public void setFailedLoginAttempts(Integer failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }

    public LocalDateTime getAccountLockedUntil() { return accountLockedUntil; }
    public void setAccountLockedUntil(LocalDateTime accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; }

    public void incrementTokenVersion() {
        this.tokenVersion = (this.tokenVersion == null ? 0L : this.tokenVersion) + 1;
    }
}