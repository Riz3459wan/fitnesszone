package com.gym.controller;

import com.gym.dto.LoginRequest;
import com.gym.dto.AuthResponse;
import com.gym.dto.ApiResponse;
import com.gym.dto.RegisterRequest;
import com.gym.model.User;
import com.gym.repository.UserRepository;
import com.gym.service.AuthService;
import com.gym.service.UserService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Key;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final long jwtExpiration;
    private final boolean cookieSecure;
    private final String jwtSecret;

    public AuthController(AuthService authService,
                          UserService userService,
                          UserRepository userRepository,
                          @Value("${jwt.expiration}") long jwtExpiration,
                          @Value("${cookie.secure:false}") boolean cookieSecure,
                          @Value("${jwt.secret}") String jwtSecret) {
        this.authService = authService;
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtExpiration = jwtExpiration;
        this.cookieSecure = cookieSecure;
        this.jwtSecret = jwtSecret;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                             HttpServletResponse response) {
        AuthResponse authResponse = authService.authenticate(
            loginRequest.getEmail(),
            loginRequest.getPassword(),
            loginRequest.getSubdomain()
        );

        if (authResponse != null) {
            Cookie cookie = new Cookie("auth_token", authResponse.getToken());
            cookie.setHttpOnly(true);
            cookie.setSecure(cookieSecure);
            cookie.setPath("/");
            cookie.setMaxAge((int) (jwtExpiration / 1000));
            response.addCookie(cookie);

            // Never send the raw token in the response body
            AuthResponse safeResponse = new AuthResponse(
                null,
                authResponse.getUsername(),
                authResponse.getRole(),
                authResponse.getUserId(),
                authResponse.getGym()
            );
            return ResponseEntity.ok(ApiResponse.success("Login successful", safeResponse));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(HttpServletRequest request) {
        String token = extractTokenFromCookie(request);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("No session"));
        }
        if (!authService.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Session expired"));
        }

        try {
            Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody();

            Long userId = claims.get("userId", Long.class);
            String role = claims.get("role", String.class);

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not found"));
            }

            Map<String, Object> gymMap = new HashMap<>();
            if (user.getGymId() != null) {
                gymMap = userService.getGymBySubdomain(null, user.getGymId());
            }

            AuthResponse meResponse = new AuthResponse(null, user.getUsername(), role, userId, gymMap);
            return ResponseEntity.ok(ApiResponse.success("Session valid", meResponse));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest request,
                                              HttpServletResponse response) {
        String token = extractTokenFromCookie(request);
        if (token != null) authService.invalidateToken(token);

        Cookie cookie = new Cookie("auth_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest registerRequest) {
        Object result = userService.createUserWithGym(registerRequest);
        if (result != null) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Registration successful", result));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Email or subdomain already exists"));
    }

    @GetMapping("/gym/{subdomain}")
    public ResponseEntity<ApiResponse> getGymBySubdomain(@PathVariable String subdomain) {
        Object gym = userService.getGymBySubdomain(subdomain);
        if (gym != null) return ResponseEntity.ok(ApiResponse.success("Gym found", gym));
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Gym not found"));
    }

    @GetMapping("/check-subdomain")
    public ResponseEntity<ApiResponse> checkSubdomain(@RequestParam String subdomain) {
        if (subdomain == null || subdomain.trim().isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("available", false);
            res.put("message", "Subdomain is required");
            return ResponseEntity.badRequest().body(ApiResponse.success("Subdomain check", res));
        }
        boolean available = userService.isSubdomainAvailable(subdomain.toLowerCase().trim());
        Map<String, Object> res = new HashMap<>();
        res.put("available", available);
        if (!available) res.put("message", "Subdomain already taken");
        return ResponseEntity.ok(ApiResponse.success("Subdomain check", res));
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "auth_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }
}
