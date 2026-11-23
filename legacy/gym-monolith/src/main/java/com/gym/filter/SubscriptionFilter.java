package com.gym.filter;

import com.gym.service.SubscriptionService;
import com.gym.config.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(1)
public class SubscriptionFilter extends OncePerRequestFilter {

    private final SubscriptionService subscriptionService;

    public SubscriptionFilter(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        if (path.startsWith("/api/auth/") || path.startsWith("/api/subscription/")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        Long gymId = TenantContext.getCurrentGymId();
        if (gymId != null && !subscriptionService.isGymActive(gymId)) {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write("{\"success\":false,\"message\":\"Subscription expired. Please renew.\",\"redirect\":\"/subscription\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}