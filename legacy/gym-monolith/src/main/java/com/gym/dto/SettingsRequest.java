package com.gym.dto;

import java.util.Map;

public class SettingsRequest {
    private Map<String, Object> settings;
    private Map<String, Object> notifications;
    private Map<String, Object> appearance;

    public SettingsRequest() {}

    public Map<String, Object> getSettings() { return settings; }
    public void setSettings(Map<String, Object> settings) { this.settings = settings; }

    public Map<String, Object> getNotifications() { return notifications; }
    public void setNotifications(Map<String, Object> notifications) { this.notifications = notifications; }

    public Map<String, Object> getAppearance() { return appearance; }
    public void setAppearance(Map<String, Object> appearance) { this.appearance = appearance; }

    public Map<String, Object> getSecurity() { return null; }
    public Map<String, Object> getBackup()   { return null; }
}