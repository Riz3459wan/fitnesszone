package com.gym.dto;

import java.util.Map;

public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private Long userId;
    private Map<String, Object> gym;
    
    public AuthResponse() {}
    
    public AuthResponse(String token, String username, String role, Long userId, Map<String, Object> gym) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.userId = userId;
        this.gym = gym;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public Map<String, Object> getGym() {
        return gym;
    }
    
    public void setGym(Map<String, Object> gym) {
        this.gym = gym;
    }
}