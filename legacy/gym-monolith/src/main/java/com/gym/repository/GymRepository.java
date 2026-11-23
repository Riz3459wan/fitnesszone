package com.gym.repository;

import com.gym.model.Gym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GymRepository extends JpaRepository<Gym, Long> {
    Optional<Gym> findBySubdomain(String subdomain);
    Optional<Gym> findByName(String name);
    boolean existsBySubdomain(String subdomain);
}