package com.gym.repository;

import com.gym.model.Gym;
import com.gym.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
@DisplayName("UserRepository")
class UserRepositoryTest {

    @Autowired UserRepository userRepository;
    @Autowired GymRepository gymRepository;

    private Gym gymA, gymB;

    @BeforeEach
    void setUp() {
        gymA = savedGym("Alpha", "alpha");
        gymB = savedGym("Beta",  "beta");
    }

    private Gym savedGym(String name, String sub) {
        Gym g = new Gym(); g.setName(name); g.setSubdomain(sub);
        return gymRepository.save(g);
    }

    private User savedUser(String username, String email, String role, Gym gym) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPassword("hashed");
        u.setRole(role);
        u.setActive(true);
        u.setGymId(gym.getId());
        u.setTokenVersion(0L);
        u.setCreatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    @Test
    @DisplayName("findByUsername returns user when exists")
    void findByUsername_exists() {
        savedUser("alice", "alice@a.com", "ADMIN", gymA);
        assertThat(userRepository.findByUsername("alice")).isPresent();
    }

    @Test
    @DisplayName("findByUsername returns empty for unknown user")
    void findByUsername_notFound() {
        assertThat(userRepository.findByUsername("ghost")).isEmpty();
    }

    @Test
    @DisplayName("findByUsernameAndGymId returns user for correct gym")
    void findByUsernameAndGymId_correctGym() {
        savedUser("bob", "bob@a.com", "ADMIN", gymA);
        Optional<User> found = userRepository.findByUsernameAndGymId("bob", gymA.getId());
        assertThat(found).isPresent();
    }

    @Test
    @DisplayName("findByUsernameAndGymId returns empty for wrong gym")
    void findByUsernameAndGymId_wrongGym() {
        savedUser("bob", "bob@a.com", "ADMIN", gymA);
        Optional<User> found = userRepository.findByUsernameAndGymId("bob", gymB.getId());
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("findByGymId returns only users for that gym")
    void findByGymId_onlyCorrectGym() {
        savedUser("userA", "ua@a.com", "ADMIN",   gymA);
        savedUser("userB", "ub@b.com", "TRAINER", gymB);

        List<User> gymAUsers = userRepository.findByGymId(gymA.getId());
        assertThat(gymAUsers).hasSize(1).extracting(User::getUsername).containsOnly("userA");
    }

    @Test
    @DisplayName("tokenVersion starts at 0 and increments correctly")
    void tokenVersion_incrementsCorrectly() {
        User u = savedUser("carol", "carol@a.com", "ADMIN", gymA);
        assertThat(u.getTokenVersion()).isEqualTo(0L);

        u.incrementTokenVersion();
        userRepository.save(u);

        User reloaded = userRepository.findById(u.getId()).orElseThrow();
        assertThat(reloaded.getTokenVersion()).isEqualTo(1L);
    }

    @Test
    @DisplayName("searchUsersByGym finds by partial username, case-insensitive")
    void searchUsersByGym_caseInsensitive() {
        savedUser("AdminAlpha", "admin@a.com", "ADMIN", gymA);
        savedUser("TrainerBeta", "trainer@b.com", "TRAINER", gymB);

        List<User> results = userRepository.searchUsersByGym(gymA.getId(), "admin");
        assertThat(results).hasSize(1).extracting(User::getUsername).containsOnly("AdminAlpha");
    }
}