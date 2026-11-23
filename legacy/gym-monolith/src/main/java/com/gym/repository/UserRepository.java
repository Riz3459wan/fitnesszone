package com.gym.repository;

import com.gym.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ── Global lookups (ADMIN owner registration only) ──────────────────────
    Optional<User> findByEmail(String email);

    // ── Gym-scoped lookups (login & staff management) ────────────────────────
    // A trainer/staff member is identified by email + gymId.
    // Two gyms CAN have a user with the same email — they are different accounts.
    Optional<User> findByEmailAndGymId(String email, Long gymId);

    // ── Legacy username helpers (profile display, token subject) ─────────────
    // username is still stored but no longer used as the login credential.
    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndGymId(String username, Long gymId);

    List<User> findByRole(String role);
    List<User> findByActive(Boolean active);
    List<User> findByGymId(Long gymId);

    @Query("SELECT u FROM User u WHERE u.gymId = :gymId AND " +
           "(LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchUsersByGym(@Param("gymId") Long gymId, @Param("keyword") String keyword);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@Param("keyword") String keyword);
}
