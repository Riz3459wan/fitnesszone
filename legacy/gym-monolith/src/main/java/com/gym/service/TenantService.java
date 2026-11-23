package com.gym.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;

@Service
public class TenantService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public Long extractUserIdFromToken(String token) {
        return extractClaim(token, "userId");
    }

    public Long extractGymIdFromToken(String token) {
        return extractClaim(token, "gymId");
    }

    private Long extractClaim(String token, String claimName) {
        try {
            Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key).build()
                    .parseClaimsJws(token).getBody();
            return claims.get(claimName, Long.class);
        } catch (Exception e) {
            return null;
        }
    }
}
