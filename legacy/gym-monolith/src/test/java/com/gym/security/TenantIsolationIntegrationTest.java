package com.gym.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.GymApplication;
import com.gym.model.Gym;
import com.gym.model.Member;
import com.gym.model.User;
import com.gym.repository.GymRepository;
import com.gym.repository.MemberRepository;
import com.gym.repository.MembershipPlanRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = GymApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Tenant isolation — integration")
class TenantIsolationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired GymRepository gymRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired MembershipPlanRepository planRepository;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private Gym gymA, gymB;
    private Member memberOfGymA;
    private String tokenA, tokenB;

    @BeforeEach
    void setUp() throws Exception {
        planRepository.deleteAll();
        memberRepository.deleteAll();
        userRepository.deleteAll();
        gymRepository.deleteAll();

        gymA = savedGym("Gym Alpha", "alpha");
        gymB = savedGym("Gym Beta", "beta");

        savedAdmin("adminA", "passA", gymA);
        savedAdmin("adminB", "passB", gymB);

        memberOfGymA = new Member();
        memberOfGymA.setGymId(gymA.getId());
        memberOfGymA.setName("Alice from Alpha");
        memberOfGymA.setEmail("alice@alpha.com");
        memberOfGymA.setPhone("1111111111");
        memberOfGymA.setJoinDate(LocalDate.now());
        memberOfGymA.setRegistrationNumber("alpha-001");
        memberOfGymA = memberRepository.save(memberOfGymA);

        tokenA = login("adminA", "passA");
        tokenB = login("adminB", "passB");
    }

    private Gym savedGym(String name, String subdomain) {
        Gym g = new Gym();
        g.setName(name);
        g.setSubdomain(subdomain);
        return gymRepository.save(g);
    }

    private void savedAdmin(String username, String password, Gym gym) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        u.setEmail(username + "@test.com");
        u.setRole("ADMIN");
        u.setActive(true);
        u.setGymId(gym.getId());
        u.setTokenVersion(0L);
        u.setCreatedAt(LocalDateTime.now());
        userRepository.save(u);
    }

    private String login(String username, String password) throws Exception {
        Map<String, String> body = Map.of("username", username, "password", password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andReturn();
        Map<?, ?> resp = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        return (String) ((Map<?, ?>) resp.get("data")).get("token");
    }

    @Test
    @DisplayName("admin of gym A sees only gym A members — gym B member not visible")
    void gymAAdmin_cannotSeeGymBData() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/members")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).contains("Alice from Alpha");
        assertThat(body).doesNotContain("Gym Beta");
    }

    @Test
    @DisplayName("admin of gym B gets an empty member list — cannot see gym A members")
    void gymBAdmin_seesEmptyList_notGymAMembers() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/members")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("Alice from Alpha");
    }

    @Test
    @DisplayName("admin of gym B cannot fetch a member by ID that belongs to gym A — returns 404")
    void gymBAdmin_cannotFetchGymAMemberById() throws Exception {
        mockMvc.perform(get("/api/members/" + memberOfGymA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("admin of gym B cannot delete a member belonging to gym A — returns 404")
    void gymBAdmin_cannotDeleteGymAMember() throws Exception {
        mockMvc.perform(delete("/api/members/" + memberOfGymA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isNotFound());

        assertThat(memberRepository.findById(memberOfGymA.getId())).isPresent();
    }

    @Test
    @DisplayName("admin of gym A can fetch their own member by ID")
    void gymAAdmin_canFetchOwnMemberById() throws Exception {
        mockMvc.perform(get("/api/members/" + memberOfGymA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Alice from Alpha"));
    }

    @Test
    @DisplayName("admin of gym A can delete their own member")
    void gymAAdmin_canDeleteOwnMember() throws Exception {
        mockMvc.perform(delete("/api/members/" + memberOfGymA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        assertThat(memberRepository.findById(memberOfGymA.getId())).isEmpty();
    }
}