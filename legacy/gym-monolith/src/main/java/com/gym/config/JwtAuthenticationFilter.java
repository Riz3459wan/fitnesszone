package com.gym.config;

import com.gym.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Key;
import java.util.Arrays;
import java.util.List;

@Component
@Order(2)
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final String jwtSecret;
    private final AuthService authService;

    public JwtAuthenticationFilter(@Value("${jwt.secret}") String jwtSecret,
                                   AuthService authService) {
        this.jwtSecret = jwtSecret;
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractTokenFromCookie(request);
        if (token == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
        }

        if (token != null) {
            if (!authService.isTokenValid(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been invalidated");
                return;
            }

            try {
                Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(key).build()
                        .parseClaimsJws(token).getBody();

                String email = claims.getSubject();
                Long userId = claims.get("userId", Long.class);
                Long gymId = claims.get("gymId", Long.class);
                String role = claims.get("role", String.class);
                if (role == null) role = "TRAINER";

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    List<SimpleGrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority(role));
                    UserDetails userDetails = org.springframework.security.core.userdetails.User
                            .withUsername(email).password("").authorities(authorities).build();
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    if (userId != null) TenantContext.setCurrentUserId(userId);
                    if (gymId != null) TenantContext.setCurrentGymId(gymId);
                }
            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Invalid or expired token");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "auth_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }
}