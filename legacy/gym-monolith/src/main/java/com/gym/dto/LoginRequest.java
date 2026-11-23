package com.gym.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 4, max = 100, message = "Password must be between 4 and 100 characters")
    private String password;

    // Subdomain is read from the request Host header by TenantInterceptor,
    // but the frontend also sends it explicitly so login works on localhost dev
    // where there is no real subdomain in the URL.
    private String subdomain;

    public LoginRequest() {}

    public LoginRequest(String email, String password, String subdomain) {
        this.email = email;
        this.password = password;
        this.subdomain = subdomain;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
}
