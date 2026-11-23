package com.gym.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(0)
public class RateLimitingFilter implements Filter {

    private final Map<String, int[]> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 30;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String uri = httpRequest.getRequestURI();
        if (uri.contains("/auth/login") || uri.contains("/auth/register")) {
            String clientIp = getClientIp(httpRequest);
            long currentMinute = System.currentTimeMillis() / 60000;
            String key = clientIp + ":" + currentMinute;
            
            int[] count = requestCounts.computeIfAbsent(key, k -> new int[]{0});
            if (count[0] >= MAX_REQUESTS_PER_MINUTE) {
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
            count[0]++;
            
            cleanupOldEntries(currentMinute);
        }
        
        chain.doFilter(request, response);
    }
    
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
    
    private void cleanupOldEntries(long currentMinute) {
        requestCounts.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            long minute = Long.parseLong(key.split(":")[1]);
            return minute < currentMinute;
        });
    }
    
    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }
    
    @Override
    public void destroy() {
        requestCounts.clear();
    }
}