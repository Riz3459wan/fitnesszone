package com.gym.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ChangePasswordRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "New password must be at least 6 characters")
    private String newPassword;

    public ChangePasswordRequest() {}

    public ChangePasswordRequest(Long userId, String currentPassword, String newPassword) {
        this.userId = userId;
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}