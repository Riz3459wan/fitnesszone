package com.gym.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.GymApplication;
import com.gym.model.Gym;
import com.gym.model.User;
import com.gym.repository.GymRepository;
import com.gym.repository.MemberRepository;
import com.gym.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = GymApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Token invalidation — integration")
class TokenInvalidationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired GymRepository gymRepository;
    @Autowired MemberRepository memberRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private Gym gym;
    private User adminUser;

    @BeforeEach
    void setUp() {
        memberRepository.deleteAll();
        userRepository.deleteAll();
        gymRepository.deleteAll();

        gym = new Gym();
        gym.setName("Integration Gym");
        gym.setSubdomain("intgym");
        gym = gymRepository.save(gym);

        adminUser = new User();
        adminUser.setUsername("intadmin");
        adminUser.setPassword(encoder.encode("pass123"));
        adminUser.setEmail("intadmin@test.com");
        adminUser.setRole("ADMIN");
        adminUser.setActive(true);
        adminUser.setGymId(gym.getId());
        adminUser.setTokenVersion(0L);
        adminUser.setCreatedAt(LocalDateTime.now());
        adminUser = userRepository.save(adminUser);
    }

    private String loginAndGetToken() throws Exception {
        Map<String, String> body = Map.of("username", "intadmin", "password", "pass123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString();
        Map<?, ?> response = objectMapper.readValue(json, Map.class);
        Map<?, ?> data = (Map<?, ?>) response.get("data");
        return (String) data.get("token");
    }

    private String loginAndGetCookie() throws Exception {
        Map<String, String> body = Map.of("username", "intadmin", "password", "pass123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getHeader("Set-Cookie");
    }

    @Test
    @DisplayName("authenticated request succeeds with valid token in Authorization header")
    void validToken_requestSucceeds() throws Exception {
        String token = loginAndGetToken();

        mockMvc.perform(get("/api/members")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("authenticated request returns 401 after logout invalidates the token")
    void afterLogout_tokenIsRejectedWith401() throws Exception {
        String cookie = loginAndGetCookie();

        mockMvc.perform(post("/api/auth/logout")
                        .header("Cookie", cookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/members")
                        .header("Cookie", cookie))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("old token rejected after second login issues a new version")
    void oldTokenRejectedAfterReLogin() throws Exception {
        String cookie1 = loginAndGetCookie();
        String token1 = loginAndGetToken();

        mockMvc.perform(post("/api/auth/logout")
                        .header("Cookie", cookie1))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/members")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("login with wrong password returns 401")
    void wrongPassword_returns401() throws Exception {
        Map<String, String> body = Map.of("username", "intadmin", "password", "wrong");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("request without token to protected endpoint returns 401")
    void noToken_protectedEndpoint_returns401() throws Exception {
        mockMvc.perform(get("/api/members"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TRAINER cannot access ADMIN-only endpoint")
    void trainerCannotAccessAdminEndpoint() throws Exception {
        User trainer = new User();
        trainer.setUsername("trainer1");
        trainer.setPassword(encoder.encode("pass123"));
        trainer.setEmail("trainer1@test.com");
        trainer.setRole("TRAINER");
        trainer.setActive(true);
        trainer.setGymId(gym.getId());
        trainer.setTokenVersion(0L);
        trainer.setCreatedAt(LocalDateTime.now());
        userRepository.save(trainer);

        Map<String, String> body = Map.of("username", "trainer1", "password", "pass123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();

        String json = loginResult.getResponse().getContentAsString();
        Map<?, ?> resp = objectMapper.readValue(json, Map.class);
        Map<?, ?> data = (Map<?, ?>) resp.get("data");
        String trainerToken = (String) data.get("token");

        mockMvc.perform(get("/api/reports/members")
                        .header("Authorization", "Bearer " + trainerToken))
                .andExpect(status().isForbidden());
    }
}