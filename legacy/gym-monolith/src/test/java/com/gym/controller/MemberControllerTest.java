package com.gym.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gym.config.TenantContext;
import com.gym.model.Member;
import com.gym.service.MemberService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MemberController.class)
@Import(MemberControllerTest.TestSecurityConfig.class)
@DisplayName("MemberController")
class MemberControllerTest {

    @Configuration
    static class TestSecurityConfig {
        @Bean
        SecurityFilterChain testChain(HttpSecurity http) throws Exception {
            return http
                .csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.anyRequest().authenticated())
                .build();
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean MemberService memberService;

    @BeforeEach void setup() { TenantContext.setCurrentGymId(1L); }
    @AfterEach  void tearDown() { TenantContext.clear(); }

    private Member sampleMember(Long id, String name) {
        Member m = new Member();
        m.setId(id);
        m.setGymId(1L);
        m.setName(name);
        m.setEmail(name.toLowerCase() + "@test.com");
        m.setPhone("9000000000");
        m.setJoinDate(LocalDate.now());
        m.setRegistrationNumber("gym-001");
        return m;
    }

    @Nested
    @DisplayName("GET /api/members")
    class GetAll {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 with member list")
        void returnsMembers() throws Exception {
            when(memberService.getAllMembers()).thenReturn(List.of(sampleMember(1L, "Alice")));

            mockMvc.perform(get("/api/members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data[0].name").value("Alice"));
        }

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 with empty list when no members")
        void emptyList() throws Exception {
            when(memberService.getAllMembers()).thenReturn(List.of());
            mockMvc.perform(get("/api/members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("delegates to date-range method when startDate and endDate provided")
        void withDateRange_callsDateRangeMethod() throws Exception {
            when(memberService.getMembersByDateRange(any(), any())).thenReturn(List.of());

            mockMvc.perform(get("/api/members")
                            .param("startDate", "2024-01-01")
                            .param("endDate", "2024-12-31"))
                    .andExpect(status().isOk());

            verify(memberService).getMembersByDateRange(
                    LocalDate.of(2024, 1, 1), LocalDate.of(2024, 12, 31));
            verify(memberService, never()).getAllMembers();
        }
    }

    @Nested
    @DisplayName("GET /api/members/{id}")
    class GetById {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 when member found")
        void found_returns200() throws Exception {
            when(memberService.getMemberById(1L)).thenReturn(sampleMember(1L, "Alice"));
            mockMvc.perform(get("/api/members/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Alice"));
        }

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 404 when member not found or wrong tenant")
        void notFound_returns404() throws Exception {
            when(memberService.getMemberById(99L)).thenReturn(null);
            mockMvc.perform(get("/api/members/99"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("POST /api/members")
    class Create {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 201 on successful creation")
        void created_returns201() throws Exception {
            Member input = sampleMember(null, "Bob");
            Member saved  = sampleMember(2L, "Bob");
            when(memberService.createMember(any())).thenReturn(saved);

            mockMvc.perform(post("/api/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(input)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.id").value(2));
        }
    }

    @Nested
    @DisplayName("PUT /api/members/{id}")
    class Update {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 on successful update")
        void updated_returns200() throws Exception {
            Member updated = sampleMember(1L, "Alice Updated");
            when(memberService.updateMember(eq(1L), any())).thenReturn(updated);

            mockMvc.perform(put("/api/members/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updated)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Alice Updated"));
        }

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 404 when member not found")
        void notFound_returns404() throws Exception {
            when(memberService.updateMember(eq(99L), any())).thenReturn(null);

            mockMvc.perform(put("/api/members/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(sampleMember(99L, "Ghost"))))
                    .andExpect(status().isNotFound());
        }
    }

    @Nested
    @DisplayName("DELETE /api/members/{id}")
    class Delete {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 when member deleted")
        void deleted_returns200() throws Exception {
            when(memberService.deleteMember(1L)).thenReturn(true);
            mockMvc.perform(delete("/api/members/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 404 when member does not exist — not silent 200")
        void notFound_returns404_notSilent200() throws Exception {
            when(memberService.deleteMember(99L)).thenReturn(false);
            mockMvc.perform(delete("/api/members/99"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @WithMockUser(authorities = "TRAINER")
        @DisplayName("returns 403 when TRAINER tries to delete")
        void trainer_cannotDelete_returns403() throws Exception {
            mockMvc.perform(delete("/api/members/1"))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/members/search")
    class Search {

        @Test
        @WithMockUser(authorities = "ADMIN")
        @DisplayName("returns 200 with search results")
        void search_returns200() throws Exception {
            when(memberService.searchMembers("ali")).thenReturn(List.of(sampleMember(1L, "Alice")));
            mockMvc.perform(get("/api/members/search").param("term", "ali"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].name").value("Alice"));
        }
    }
}