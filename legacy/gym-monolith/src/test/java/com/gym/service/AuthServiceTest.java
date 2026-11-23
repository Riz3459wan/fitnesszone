package com.gym.service;

import com.gym.dto.AuthResponse;
import com.gym.model.Gym;
import com.gym.model.User;
import com.gym.repository.GymRepository;
import com.gym.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    private static final String SECRET =
        "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtbG9uZy1lbm91Z2gtZm9yLUhTMjU2LWluLXRlc3Rz";
    private static final long EXPIRATION = 86_400_000L;

    @Mock private UserRepository userRepository;
    @Mock private GymRepository gymRepository;
    @Mock private UserService userService;

    private AuthService authService;
    private BCryptPasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, gymRepository, SECRET, EXPIRATION);
        encoder = new BCryptPasswordEncoder();
    }

    private User buildUser(Long id, String username, String password, Long gymId, Long tokenVersion) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        u.setRole("ADMIN");
        u.setActive(true);
        u.setGymId(gymId);
        u.setTokenVersion(tokenVersion);
        return u;
    }

    private Gym buildGym(Long id, String subdomain) {
        Gym g = new Gym();
        g.setId(id);
        g.setName("Test Gym");
        g.setSubdomain(subdomain);
        return g;
    }

    @Nested
    @DisplayName("authenticate")
    class Authenticate {

        @Test
        @DisplayName("returns AuthResponse when credentials are valid")
        void validCredentials_returnsAuthResponse() {
            User user = buildUser(1L, "admin", "secret123", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(gymRepository.findById(10L)).thenReturn(Optional.of(buildGym(10L, "mygym")));

            AuthResponse response = authService.authenticate("admin", "secret123", null);

            assertThat(response).isNotNull();
            assertThat(response.getUsername()).isEqualTo("admin");
            assertThat(response.getRole()).isEqualTo("ADMIN");
            assertThat(response.getToken()).isNotBlank();
        }

        @Test
        @DisplayName("returns null when password is wrong")
        void wrongPassword_returnsNull() {
            User user = buildUser(1L, "admin", "correct", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

            AuthResponse response = authService.authenticate("admin", "wrong", null);

            assertThat(response).isNull();
        }

        @Test
        @DisplayName("returns null when user does not exist")
        void unknownUser_returnsNull() {
            when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

            assertThat(authService.authenticate("ghost", "any", null)).isNull();
        }

        @Test
        @DisplayName("returns null when account is inactive")
        void inactiveUser_returnsNull() {
            User user = buildUser(1L, "admin", "secret123", 10L, 0L);
            user.setActive(false);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

            assertThat(authService.authenticate("admin", "secret123", null)).isNull();
        }

        @Test
        @DisplayName("looks up user by gym when subdomain is provided")
        void withSubdomain_lookupsUserByGym() {
            Gym gym = buildGym(10L, "mygym");
            User user = buildUser(1L, "admin", "pass", 10L, 0L);
            when(gymRepository.findBySubdomain("mygym")).thenReturn(Optional.of(gym));
            when(userRepository.findByUsernameAndGymId("admin", 10L)).thenReturn(Optional.of(user));

            AuthResponse response = authService.authenticate("admin", "pass", "mygym");

            assertThat(response).isNotNull();
            verify(userRepository).findByUsernameAndGymId("admin", 10L);
            verify(userRepository, never()).findByUsername(any());
        }
    }

    @Nested
    @DisplayName("token invalidation")
    class TokenInvalidation {

        @Test
        @DisplayName("isTokenValid returns true for a freshly issued token")
        void freshToken_isValid() {
            User user = buildUser(1L, "admin", "pass", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(gymRepository.findById(10L)).thenReturn(Optional.of(buildGym(10L, "gym")));

            AuthResponse response = authService.authenticate("admin", "pass", null);
            assertThat(authService.isTokenValid(response.getToken())).isTrue();
        }

        @Test
        @DisplayName("isTokenValid returns false after invalidateToken is called")
        void afterInvalidation_tokenIsInvalid() {
            User user = buildUser(1L, "admin", "pass", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(gymRepository.findById(10L)).thenReturn(Optional.of(buildGym(10L, "gym")));

            AuthResponse response = authService.authenticate("admin", "pass", null);
            String token = response.getToken();

            user.incrementTokenVersion();
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

            assertThat(authService.isTokenValid(token)).isFalse();
        }

        @Test
        @DisplayName("invalidateToken increments tokenVersion in DB")
        void invalidateToken_incrementsVersion() {
            User user = buildUser(1L, "admin", "pass", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(gymRepository.findById(10L)).thenReturn(Optional.of(buildGym(10L, "gym")));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            AuthResponse resp = authService.authenticate("admin", "pass", null);
            authService.invalidateToken(resp.getToken());

            verify(userRepository).save(argThat(u -> u.getTokenVersion() == 1L));
        }

        @Test
        @DisplayName("isTokenValid returns false for a completely garbage token")
        void garbageToken_isInvalid() {
            assertThat(authService.isTokenValid("not.a.token")).isFalse();
        }

        @Test
        @DisplayName("token from version 0 is rejected when DB version is 1")
        void staleVersionToken_isRejected() {
            User userAtV0 = buildUser(1L, "admin", "pass", 10L, 0L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(userAtV0));
            when(gymRepository.findById(10L)).thenReturn(Optional.of(buildGym(10L, "gym")));

            String oldToken = authService.authenticate("admin", "pass", null).getToken();

            User userAtV1 = buildUser(1L, "admin", "pass", 10L, 1L);
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(userAtV1));

            assertThat(authService.isTokenValid(oldToken)).isFalse();
        }
    }
}