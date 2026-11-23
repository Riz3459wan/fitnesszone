package com.gym.service;

import com.gym.config.TenantContext;
import com.gym.model.Gym;
import com.gym.model.Settings;
import com.gym.model.User;
import com.gym.dto.SettingsRequest;
import com.gym.dto.SettingsResponse;
import com.gym.repository.GymRepository;
import com.gym.repository.SettingsRepository;
import com.gym.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SettingsService {

    @Autowired
    private SettingsRepository settingsRepository;

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private UserRepository userRepository;

    private Long getCurrentGymId() {
        Long gymId = TenantContext.getCurrentGymId();
        if (gymId != null) return gymId;
        Long userId = TenantContext.getCurrentUserId();
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getGymId() != null) {
                gymId = user.getGymId();
                TenantContext.setCurrentGymId(gymId);
            }
        }
        return gymId;
    }

    private Long getCurrentUserId() {
        return TenantContext.getCurrentUserId();
    }

    @Transactional(readOnly = true)
    public SettingsResponse getSettings() {
        Long gymId = getCurrentGymId();
        Long userId = getCurrentUserId();

        Map<String, Object> generalMap = new HashMap<>();
        if (gymId != null) {
            Gym gym = gymRepository.findById(gymId).orElse(null);
            if (gym != null) {
                generalMap.put("gymName", gym.getName());
                generalMap.put("subdomain", gym.getSubdomain());
                generalMap.put("planName", gym.getPlanName() != null ? gym.getPlanName() : "");
                generalMap.put("subscriptionStatus", gym.getSubscriptionStatus() != null ? gym.getSubscriptionStatus() : "trial");
            }
        }

        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                generalMap.put("email", user.getEmail() != null ? user.getEmail() : "");
                generalMap.put("phone", user.getPhone() != null ? user.getPhone() : "");
                generalMap.put("adminName", user.getFullName() != null ? user.getFullName() : "");
            }
        }

        Map<String, Object> notificationsMap = new HashMap<>();
        Map<String, Object> appearanceMap = new HashMap<>();

        if (gymId != null) {
            List<Settings> allSettings = settingsRepository.findByGymId(gymId);
            for (Settings setting : allSettings) {
                String key = setting.getSettingKey();
                Object parsedValue = parseValue(setting.getSettingValue());
                String category = setting.getCategory() != null ? setting.getCategory() : "general";
                switch (category) {
                    case "general" -> {
                        if (!generalMap.containsKey(key)) generalMap.put(key, parsedValue);
                    }
                    case "notifications" -> notificationsMap.put(key, parsedValue);
                    case "appearance"    -> appearanceMap.put(key, parsedValue);
                }
            }
        }

        if (!generalMap.containsKey("timezone"))   generalMap.put("timezone",   "Asia/Kolkata");
        if (!generalMap.containsKey("currency"))    generalMap.put("currency",   "INR");
        if (!generalMap.containsKey("dateFormat"))  generalMap.put("dateFormat", "DD/MM/YYYY");
        if (!generalMap.containsKey("timeFormat"))  generalMap.put("timeFormat", "24h");
        if (!generalMap.containsKey("address"))     generalMap.put("address",    "");

        if (notificationsMap.isEmpty()) notificationsMap = getDefaultNotifications();
        else mergeDefaults(notificationsMap, getDefaultNotifications());

        if (appearanceMap.isEmpty()) appearanceMap = getDefaultAppearance();
        else mergeDefaults(appearanceMap, getDefaultAppearance());

        return new SettingsResponse(generalMap, notificationsMap, null, appearanceMap, null);
    }

    @Transactional
    public SettingsResponse saveSettings(SettingsRequest request) {
        Long gymId = getCurrentGymId();
        Long userId = getCurrentUserId();

        if (gymId == null) throw new RuntimeException("Cannot save settings: No gym context");

        if (request.getSettings() != null) {
            Gym gym = gymRepository.findById(gymId).orElse(null);
            if (gym != null) {
                Map<String, Object> general = request.getSettings();
                if (general.containsKey("gymName") && general.get("gymName") != null) {
                    gym.setName(general.get("gymName").toString());
                }
                gym.setUpdatedAt(LocalDateTime.now());
                gymRepository.save(gym);

                Map<String, Object> prefsToSave = new HashMap<>();
                for (String key : List.of("timezone", "currency", "dateFormat", "timeFormat", "address")) {
                    if (general.containsKey(key)) prefsToSave.put(key, general.get(key));
                }
                saveCategorySettings(gymId, userId, "general", prefsToSave);
            }
        }

        if (request.getSettings() != null && userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                Map<String, Object> general = request.getSettings();
                if (general.containsKey("email") && general.get("email") != null)
                    user.setEmail(general.get("email").toString());
                if (general.containsKey("phone") && general.get("phone") != null)
                    user.setPhone(general.get("phone").toString());
                if (general.containsKey("adminName") && general.get("adminName") != null)
                    user.setFullName(general.get("adminName").toString());
                userRepository.save(user);
            }
        }

        saveCategorySettings(gymId, userId, "notifications", request.getNotifications());
        saveCategorySettings(gymId, userId, "appearance",    request.getAppearance());

        return getSettings();
    }

    @Transactional
    public void resetSettings() {
        Long gymId = getCurrentGymId();
        if (gymId == null) return;
        Long userId = getCurrentUserId();

        settingsRepository.deleteByGymId(gymId);
        saveCategorySettings(gymId, userId, "general", Map.of(
            "timezone", "Asia/Kolkata", "currency", "INR",
            "dateFormat", "DD/MM/YYYY", "timeFormat", "24h", "address", ""
        ));
        saveCategorySettings(gymId, userId, "notifications", getDefaultNotifications());
        saveCategorySettings(gymId, userId, "appearance",    getDefaultAppearance());
    }

    private void saveCategorySettings(Long gymId, Long userId, String category, Map<String, Object> settings) {
        if (settings == null) return;
        for (Map.Entry<String, Object> entry : settings.entrySet()) {
            String key   = entry.getKey();
            String value = entry.getValue() != null ? entry.getValue().toString() : null;
            Settings setting = settingsRepository.findByGymIdAndSettingKey(gymId, key)
                    .orElse(new Settings());
            setting.setGymId(gymId);
            setting.setUserId(userId);
            setting.setSettingKey(key);
            setting.setSettingValue(value);
            setting.setCategory(category);
            setting.setUpdatedAt(LocalDateTime.now());
            settingsRepository.save(setting);
        }
    }

    private void mergeDefaults(Map<String, Object> target, Map<String, Object> defaults) {
        for (Map.Entry<String, Object> entry : defaults.entrySet()) {
            target.putIfAbsent(entry.getKey(), entry.getValue());
        }
    }

    private Map<String, Object> getDefaultNotifications() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("inAppNotifications",  true);
        d.put("newMemberAlerts",     true);
        d.put("paymentAlerts",       true);
        d.put("attendanceAlerts",    false);
        d.put("emailNotifications",  false);
        d.put("dailyReport",         false);
        d.put("weeklyReport",        false);
        d.put("monthlyReport",       false);
        d.put("soundEnabled",        false);
        d.put("quietHours",          false);
        d.put("quietFrom",           "22:00");
        d.put("quietUntil",          "07:00");
        d.put("expiryAlerts",        true);
        d.put("expiryDaysBefore",    "7");
        return d;
    }

    private Map<String, Object> getDefaultAppearance() {
        Map<String, Object> d = new LinkedHashMap<>();
        d.put("theme",            "light");
        d.put("primaryColor",     "blue");
        d.put("fontFamily",       "inter");
        d.put("sidebarCollapsed", false);
        d.put("compactView",      false);
        d.put("animations",       true);
        d.put("showAvatars",      true);
        d.put("tableDensity",     "standard");
        return d;
    }

    private Object parseValue(String value) {
        if (value == null) return null;
        if (value.equals("true")  || value.equals("false")) return Boolean.parseBoolean(value);
        try {
            if (value.matches("\\d+\\.\\d+")) return Double.parseDouble(value);
            if (value.matches("\\d+"))        return Long.parseLong(value);
        } catch (NumberFormatException ignored) {}
        return value;
    }
}