package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.User;
import com.gym.model.Gym;
import com.gym.dto.UserRequest;
import com.gym.dto.UserResponse;
import com.gym.dto.RegisterRequest;
import com.gym.repository.UserRepository;
import com.gym.repository.GymRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository, GymRepository gymRepository) {
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
    }

    private Long getCurrentGymId() { return TenantContext.getCurrentGymId(); }

    @Transactional
    public Map<String, Object> createUserWithGym(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) return null;
        if (gymRepository.existsBySubdomain(request.getSubdomain())) return null;

        Gym gym = new Gym();
        gym.setName(request.getGymName());
        gym.setSubdomain(request.getSubdomain().toLowerCase());
        gym.setPlanId(request.getPlanId());
        gym.setPlanName(request.getPlanName());
        gym.setSubscriptionStatus("TRIAL");
        gym.setTrialStartedAt(LocalDateTime.now());
        gym.setTrialEndDate(LocalDate.now().plusDays(14));
        Gym savedGym = gymRepository.save(gym);

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setRole("ADMIN");
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setActive(true);
        user.setGymId(savedGym.getId());
        user.setCreatedAt(LocalDateTime.now());
        user.setTokenVersion(0L);
        User savedUser = userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("gymId", savedGym.getId());
        result.put("gymName", savedGym.getName());
        result.put("subdomain", savedGym.getSubdomain());
        result.put("userId", savedUser.getId());
        result.put("username", savedUser.getUsername());
        return result;
    }

    public Map<String, Object> getGymBySubdomain(String subdomain) {
        return gymRepository.findBySubdomain(subdomain).map(this::gymToMap).orElse(null);
    }

    public Map<String, Object> getGymBySubdomain(String subdomain, Long gymId) {
        if (subdomain != null) return getGymBySubdomain(subdomain);
        if (gymId != null) return gymRepository.findById(gymId).map(this::gymToMap).orElse(new HashMap<>());
        return new HashMap<>();
    }

    private Map<String, Object> gymToMap(Gym gym) {
        Map<String, Object> result = new HashMap<>();
        result.put("id", gym.getId());
        result.put("name", gym.getName());
        result.put("subdomain", gym.getSubdomain());
        result.put("planName", gym.getPlanName());
        result.put("subscriptionStatus", gym.getSubscriptionStatus());
        result.put("trialEndDate", gym.getTrialEndDate());
        return result;
    }

    public boolean isSubdomainAvailable(String subdomain) {
        return !gymRepository.existsBySubdomain(subdomain);
    }

    public List<UserResponse> getAllUsers() {
        Long gymId = getCurrentGymId();
        if (gymId == null) return new ArrayList<>();
        return userRepository.findByGymId(gymId).stream()
                .map(this::convertToResponse).toList();
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        Long gymId = getCurrentGymId();
        if (user == null) return null;
        if (gymId != null && !gymId.equals(user.getGymId())) return null;
        return convertToResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserRequest userRequest) {
        Long gymId = getCurrentGymId();
        if (gymId == null) return null;

        if (userRepository.findByEmailAndGymId(userRequest.getEmail(), gymId).isPresent()) {
            return null;
        }

        User user = new User();
        user.setUsername(userRequest.getUsername());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setEmail(userRequest.getEmail());
        user.setRole(userRequest.getRole());
        user.setFullName(userRequest.getFullName());
        user.setPhone(userRequest.getPhone());
        user.setActive(userRequest.getActive() != null ? userRequest.getActive() : true);
        user.setGymId(gymId);
        user.setCreatedAt(LocalDateTime.now());
        user.setTokenVersion(0L);
        
        return convertToResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest userRequest) {
        User user = userRepository.findById(id).orElse(null);
        Long gymId = getCurrentGymId();
        if (user == null) return null;
        if (gymId != null && !gymId.equals(user.getGymId())) return null;

        if (!user.getEmail().equals(userRequest.getEmail()) &&
                userRepository.findByEmailAndGymId(userRequest.getEmail(), gymId).isPresent()) {
            return null;
        }

        user.setUsername(userRequest.getUsername());
        user.setEmail(userRequest.getEmail());
        user.setRole(userRequest.getRole());
        user.setFullName(userRequest.getFullName());
        user.setPhone(userRequest.getPhone());
        user.setActive(userRequest.getActive());

        if (userRequest.getPassword() != null && !userRequest.getPassword().isEmpty()) {
            if (userRequest.getPassword().length() < 6)
                throw new IllegalArgumentException("Password must be at least 6 characters");
            user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        }
        return convertToResponse(userRepository.save(user));
    }

    @Transactional
    public boolean changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) return false;
        if (newPassword == null || newPassword.trim().isEmpty()) return false;
        if (newPassword.length() < 6)
            throw new IllegalArgumentException("Password must be at least 6 characters");
        if (passwordEncoder.matches(newPassword, user.getPassword()))
            throw new IllegalArgumentException("New password must be different from current password");
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        Long gymId = getCurrentGymId();
        if (user != null && (gymId == null || gymId.equals(user.getGymId()))) {
            userRepository.deleteById(id);
        }
    }

    public List<UserResponse> searchUsers(String keyword) {
        Long gymId = getCurrentGymId();
        List<User> users = (gymId != null)
                ? userRepository.searchUsersByGym(gymId, keyword)
                : userRepository.searchUsers(keyword);
        return users.stream().map(this::convertToResponse).toList();
    }

    public void updateLastLogin(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    private UserResponse convertToResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(),
                user.getRole(), user.getFullName(), user.getPhone(),
                user.getActive(), user.getCreatedAt(), user.getLastLogin());
    }
}