package com.gym.config;

import com.gym.filter.SubscriptionFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SubscriptionFilter subscriptionFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final String allowedOriginsRaw;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                          SubscriptionFilter subscriptionFilter,
                          RateLimitingFilter rateLimitingFilter,
                          @Value("${allowed.origins:http://localhost:5173,http://localhost:5174}") String allowedOriginsRaw) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.subscriptionFilter = subscriptionFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.allowedOriginsRaw = allowedOriginsRaw;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOriginsRaw.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/login").permitAll()
                    .requestMatchers("/api/auth/register").permitAll()
                    .requestMatchers("/api/auth/check-subdomain").permitAll()
                    .requestMatchers("/api/auth/gym/**").permitAll()
                    .requestMatchers("/api/auth/logout").permitAll()
                    .requestMatchers("/api/auth/me").permitAll()
                    .requestMatchers("/api/settings").permitAll()
                    .requestMatchers("/api/subscription/**").permitAll()
                    .requestMatchers("/api/webhooks/razorpay").permitAll()
                    .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(subscriptionFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}