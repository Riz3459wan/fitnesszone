package com.gym.config;

public class TenantContext {
    private static final InheritableThreadLocal<Long> currentGymId = new InheritableThreadLocal<>();
    private static final InheritableThreadLocal<Long> currentUserId = new InheritableThreadLocal<>();

    public static void setCurrentGymId(Long gymId) {
        currentGymId.set(gymId);
    }

    public static Long getCurrentGymId() {
        return currentGymId.get();
    }

    public static void setCurrentUserId(Long userId) {
        currentUserId.set(userId);
    }

    public static Long getCurrentUserId() {
        return currentUserId.get();
    }

    public static void clear() {
        currentGymId.remove();
        currentUserId.remove();
    }
}