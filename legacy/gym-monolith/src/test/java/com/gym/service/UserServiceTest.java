package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.dto.RegisterRequest;
import com.gym.dto.UserRequest;
import com.gym.dto.UserResponse;
import com.gym.model.Gym;
import com.gym.model.User;
import com.gym.repository.GymRepository;
import com.gym.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private GymRepository gymRepository;

    private UserService userService;
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        userService = new UserService(userRepository, gymRepository);
        TenantContext.setCurrentGymId(1L);
        TenantContext.setCurrentUserId(1L);
    }

    @AfterEach
    void tearDown() { TenantContext.clear(); }

    private User buildUser(Long id, String username, String email, Long gymId) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword(encoder.encode("pass123"));
        u.setRole("ADMIN");
        u.setActive(true);
        u.setGymId(gymId);
        u.setTokenVersion(0L);
        u.setCreatedAt(LocalDateTime.now());
        return u;
    }

    @Nested
    @DisplayName("createUserWithGym")
    class CreateUserWithGym {

        @Test
        @DisplayName("creates gym and user, returns result map")
        void happyPath() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("owner");
            req.setPassword("secret123");
            req.setEmail("owner@gym.com");
            req.setFullName("Gym Owner");
            req.setGymName("Iron House");
            req.setSubdomain("ironhouse");

            when(userRepository.findByUsername("owner")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("owner@gym.com")).thenReturn(Optional.empty());
            when(gymRepository.existsBySubdomain("ironhouse")).thenReturn(false);

            Gym savedGym = new Gym(); savedGym.setId(10L); savedGym.setName("Iron House"); savedGym.setSubdomain("ironhouse");
            when(gymRepository.save(any())).thenReturn(savedGym);

            User savedUser = buildUser(1L, "owner", "owner@gym.com", 10L);
            when(userRepository.save(any())).thenReturn(savedUser);

            var result = userService.createUserWithGym(req);

            assertThat(result).isNotNull();
            assertThat(result.get("gymId")).isEqualTo(10L);
            assertThat(result.get("subdomain")).isEqualTo("ironhouse");
        }

        @Test
        @DisplayName("returns null when username already exists")
        void duplicateUsername_returnsNull() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("taken"); req.setPassword("x"); req.setEmail("e@e.com");
            req.setGymName("G"); req.setSubdomain("sub");

            when(userRepository.findByUsername("taken")).thenReturn(
                    Optional.of(buildUser(1L, "taken", "e@e.com", 1L)));

            assertThat(userService.createUserWithGym(req)).isNull();
            verify(gymRepository, never()).save(any());
        }

        @Test
        @DisplayName("returns null when subdomain already taken")
        void duplicateSubdomain_returnsNull() {
            RegisterRequest req = new RegisterRequest();
            req.setUsername("new"); req.setPassword("x"); req.setEmail("new@new.com");
            req.setGymName("G"); req.setSubdomain("taken");

            when(userRepository.findByUsername("new")).thenReturn(Optional.empty());
            when(userRepository.findByEmail("new@new.com")).thenReturn(Optional.empty());
            when(gymRepository.existsBySubdomain("taken")).thenReturn(true);

            assertThat(userService.createUserWithGym(req)).isNull();
        }
    }

    @Nested
    @DisplayName("getUserById")
    class GetUserById {

        @Test
        @DisplayName("returns user when gym matches context")
        void correctGym_returnsUser() {
            User u = buildUser(1L, "alice", "a@a.com", 1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            UserResponse resp = userService.getUserById(1L);
            assertThat(resp).isNotNull();
            assertThat(resp.getUsername()).isEqualTo("alice");
        }

        @Test
        @DisplayName("returns null when user belongs to different gym")
        void differentGym_returnsNull() {
            User u = buildUser(1L, "hacker", "h@b.com", 999L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            assertThat(userService.getUserById(1L)).isNull();
        }
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePassword {

        @Test
        @DisplayName("returns true when current password is correct")
        void correctCurrent_changesPassword() {
            User u = buildUser(1L, "alice", "a@a.com", 1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));
            when(userRepository.save(any())).thenReturn(u);

            assertThat(userService.changePassword(1L, "pass123", "newPass99")).isTrue();
        }

        @Test
        @DisplayName("returns false when current password is wrong")
        void wrongCurrent_returnsFalse() {
            User u = buildUser(1L, "alice", "a@a.com", 1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            assertThat(userService.changePassword(1L, "wrongpass", "newPass99")).isFalse();
        }

        @Test
        @DisplayName("throws IllegalArgumentException when new password is same as current")
        void samePassword_throwsException() {
            User u = buildUser(1L, "alice", "a@a.com", 1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            assertThatThrownBy(() -> userService.changePassword(1L, "pass123", "pass123"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("different");
        }

        @Test
        @DisplayName("throws IllegalArgumentException when new password is too short")
        void shortPassword_throwsException() {
            User u = buildUser(1L, "alice", "a@a.com", 1L);
            when(userRepository.findById(1L)).thenReturn(Optional.of(u));

            assertThatThrownBy(() -> userService.changePassword(1L, "pass123", "ab"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("6 characters");
        }
    }

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsers {

        @Test
        @DisplayName("returns only users for current gym")
        void onlyCurrentGymUsers() {
            List<User> users = List.of(
                    buildUser(1L, "a", "a@a.com", 1L),
                    buildUser(2L, "b", "b@a.com", 1L));
            when(userRepository.findByGymId(1L)).thenReturn(users);

            List<UserResponse> result = userService.getAllUsers();
            assertThat(result).hasSize(2);
            verify(userRepository).findByGymId(1L);
        }

        @Test
        @DisplayName("returns empty list when no gym context")
        void noGymContext_returnsEmpty() {
            TenantContext.setCurrentGymId(null);
            assertThat(userService.getAllUsers()).isEmpty();
            verify(userRepository, never()).findByGymId(any());
        }
    }
}