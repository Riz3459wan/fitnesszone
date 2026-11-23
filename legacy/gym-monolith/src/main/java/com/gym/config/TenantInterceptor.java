package com.gym.config;

import com.gym.model.User;
import com.gym.repository.GymRepository;
import com.gym.repository.UserRepository;
import com.gym.service.TenantService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Autowired private UserRepository userRepository;
    @Autowired private GymRepository gymRepository;
    @Autowired private TenantService tenantService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                              HttpServletResponse response,
                              Object handler) throws Exception {
        TenantContext.clear();

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;

        String token = extractToken(request);

        // ── Step 1: resolve gymId ────────────────────────────────────────────
        Long gymIdFromToken = null;
        Long userId         = null;

        if (token != null) {
            gymIdFromToken = tenantService.extractGymIdFromToken(token);
            userId         = tenantService.extractUserIdFromToken(token);
        }

        // Fall back to subdomain in Host header when token has no gymId
        // (shouldn't happen in production, but guards localhost dev flows).
        Long gymIdFromSubdomain = null;
        if (gymIdFromToken == null) {
            String subdomain = extractSubdomain(request.getHeader("host"));
            if (subdomain != null) {
                gymIdFromSubdomain = gymRepository.findBySubdomain(subdomain)
                        .map(g -> g.getId()).orElse(null);
            }
        }

        Long finalGymId = gymIdFromToken != null ? gymIdFromToken : gymIdFromSubdomain;

        // ── Step 2: set context ──────────────────────────────────────────────
        if (userId != null) TenantContext.setCurrentUserId(userId);

        if (finalGymId != null && userId != null) {
            // Verify the authenticated user actually belongs to this gym
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("User not found");
                return false;
            }
            if (!finalGymId.equals(user.getGymId())) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Access denied: you do not belong to this gym");
                return false;
            }
            TenantContext.setCurrentGymId(finalGymId);
        } else if (finalGymId != null) {
            // Unauthenticated request to a gym subdomain (e.g. public settings read)
            TenantContext.setCurrentGymId(finalGymId);
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        TenantContext.clear();
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String extractToken(HttpServletRequest request) {
        String fromCookie = extractTokenFromCookie(request);
        if (fromCookie != null) return fromCookie;
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "auth_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }

    private String extractSubdomain(String host) {
        if (host == null) return null;
        host = host.split(":")[0];
        String[] parts = host.split("\\.");
        if (parts.length >= 3) {
            String sub = parts[0];
            if (!sub.equals("localhost") && !sub.equals("www") && !sub.equals("gymzora")) {
                return sub;
            }
        }
        return null;
    }
}
