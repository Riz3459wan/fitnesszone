package com.gym.exception;

import com.gym.controller.MemberController;
import com.gym.config.TenantContext;
import com.gym.service.MemberService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MemberController.class)
@Import(GlobalExceptionHandlerTest.TestSecurityConfig.class)
@DisplayName("GlobalExceptionHandler")
class GlobalExceptionHandlerTest {

    @Configuration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain chain(HttpSecurity http) throws Exception {
            return http.csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.anyRequest().authenticated())
                .build();
        }
    }

    @Autowired MockMvc mockMvc;
    @MockBean MemberService memberService;

    @BeforeEach void setup() { TenantContext.setCurrentGymId(1L); }
    @AfterEach  void tearDown() { TenantContext.clear(); }

    @Test
    @WithMockUser(authorities = "ADMIN")
    @DisplayName("returns 400 with helpful message for invalid date format")
    void invalidDate_returns400WithMessage() throws Exception {
        mockMvc.perform(get("/api/members")
                        .param("startDate", "not-a-date")
                        .param("endDate", "2024-12-31"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(containsString("not-a-date")));
    }

    @Test
    @DisplayName("returns 401 for unauthenticated request to protected endpoint")
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isUnauthorized());
    }
}