package com.gym.service;

import com.gym.model.User;
import com.gym.model.Gym;
import com.gym.repository.UserRepository;
import com.gym.repository.GymRepository;
import com.gym.dto.AuthResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final String jwtSecret;
    private final long jwtExpiration;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Map<String, Integer> loginAttempts = new HashMap<>();
    private final Map<String, LocalDateTime> lockoutTime = new HashMap<>();

    public AuthService(UserRepository userRepository,
                       GymRepository gymRepository,
                       @Value("${jwt.secret}") String jwtSecret,
                       @Value("${jwt.expiration}") long jwtExpiration) {
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
        this.jwtSecret = jwtSecret;
        this.jwtExpiration = jwtExpiration;
    }

    @Transactional
    public AuthResponse authenticate(String email, String password, String subdomain) {
        String key = email + (subdomain != null ? subdomain : "");
        
        if (lockoutTime.containsKey(key) && lockoutTime.get(key).isAfter(LocalDateTime.now())) {
            return null;
        }
        
        Gym gym = null;
        if (subdomain != null && !subdomain.isBlank()) {
            gym = gymRepository.findBySubdomain(subdomain).orElse(null);
        }

        User user;
        if (gym != null) {
            user = userRepository.findByEmailAndGymId(email, gym.getId()).orElse(null);
        } else {
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            loginAttempts.remove(key);
            lockoutTime.remove(key);
            
            if (user.getActive() == null || !user.getActive()) {
                return null;
            }
            
            if (gym == null && user.getGymId() != null) {
                gym = gymRepository.findById(user.getGymId()).orElse(null);
            }

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            long tokenVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0L;
            String token = generateToken(user.getId(), email, user.getRole(), tokenVersion, user.getGymId());

            Map<String, Object> gymMap = new HashMap<>();
            if (gym != null) {
                gymMap.put("id", gym.getId());
                gymMap.put("name", gym.getName());
                gymMap.put("subdomain", gym.getSubdomain());
                gymMap.put("planName", gym.getPlanName());
                gymMap.put("subscriptionStatus", gym.getSubscriptionStatus());
            }

            return new AuthResponse(token, user.getUsername(), user.getRole(), user.getId(), gymMap);
        }
        
        if (user != null) {
            int attempts = loginAttempts.getOrDefault(key, 0) + 1;
            loginAttempts.put(key, attempts);
            if (attempts >= 5) {
                lockoutTime.put(key, LocalDateTime.now().plusMinutes(15));
                loginAttempts.remove(key);
            }
        }
        
        return null;
    }

    @Transactional
    public void invalidateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            Long userId = claims.get("userId", Long.class);
            if (userId != null) {
                userRepository.findById(userId).ifPresent(user -> {
                    user.incrementTokenVersion();
                    userRepository.save(user);
                });
            }
        } catch (Exception ignored) {
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseClaims(token);
            Long userId = claims.get("userId", Long.class);
            Long claimedVersion = claims.get("tokenVersion", Long.class);
            if (userId == null) return false;
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return false;
            long currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0L;
            long claimedV = claimedVersion != null ? claimedVersion : 0L;
            return claimedV >= currentVersion;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }

    private String generateToken(Long userId, String email, String role,
                                  long tokenVersion, Long gymId) {
        Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        return Jwts.builder()
                .setSubject(email)
                .claim("userId", userId)
                .claim("gymId", gymId)
                .claim("role", role)
                .claim("tokenVersion", tokenVersion)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}