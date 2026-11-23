package com.gym.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.config.JwtAuthenticationFilter;
import com.gym.dto.AuthResponse;
import com.gym.service.AuthService;
import com.gym.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(AuthControllerTest.TestSecurityConfig.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Configuration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testChain(HttpSecurity http) throws Exception {
            return http
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.anyRequest().permitAll())
                .build();
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;
    @MockBean UserService userService;
    @MockBean JwtAuthenticationFilter jwtAuthenticationFilter;

    @Nested
    @DisplayName("POST /api/auth/login")
    class Login {

        @Test
        @DisplayName("returns 200 with token on valid credentials")
        void validCredentials_returns200() throws Exception {
            AuthResponse auth = new AuthResponse("tok123", "admin", "ADMIN", 1L, Map.of());
            when(authService.authenticate("admin", "pass", null)).thenReturn(auth);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("username", "admin", "password", "pass"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.username").value("admin"));
        }

        @Test
        @DisplayName("returns 401 when credentials are invalid")
        void invalidCredentials_returns401() throws Exception {
            when(authService.authenticate(any(), any(), any())).thenReturn(null);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(
                                    Map.of("username", "admin", "password", "wrong"))))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class Logout {

        @Test
        @DisplayName("returns 200 and clears cookie")
        void logout_returns200() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    @Nested
    @DisplayName("GET /api/auth/check-subdomain")
    class CheckSubdomain {

        @Test
        @DisplayName("returns available=true when subdomain is free")
        void subdomainAvailable() throws Exception {
            when(userService.isSubdomainAvailable("newgym")).thenReturn(true);

            mockMvc.perform(get("/api/auth/check-subdomain").param("subdomain", "newgym"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.available").value(true));
        }

        @Test
        @DisplayName("returns available=false when subdomain is taken")
        void subdomainTaken() throws Exception {
            when(userService.isSubdomainAvailable("taken")).thenReturn(false);

            mockMvc.perform(get("/api/auth/check-subdomain").param("subdomain", "taken"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.available").value(false));
        }
    }

    @Nested
    @DisplayName("GET /api/auth/gym/{subdomain}")
    class GetGymBySubdomain {

        @Test
        @DisplayName("returns gym info when subdomain exists")
        void gymFound_returns200() throws Exception {
            Map<String, Object> gymData = Map.of("id", 1, "name", "Iron House", "subdomain", "ironhouse");
            when(userService.getGymBySubdomain("ironhouse")).thenReturn(gymData);

            mockMvc.perform(get("/api/auth/gym/ironhouse"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Iron House"));
        }

        @Test
        @DisplayName("returns 404 when subdomain does not exist")
        void gymNotFound_returns404() throws Exception {
            when(userService.getGymBySubdomain("ghost")).thenReturn(null);

            mockMvc.perform(get("/api/auth/gym/ghost"))
                    .andExpect(status().isNotFound());
        }
    }
}