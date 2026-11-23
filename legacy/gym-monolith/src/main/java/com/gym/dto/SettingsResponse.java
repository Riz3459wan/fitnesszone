package com.gym.dto;

import java.util.Map;

public class SettingsResponse {

    private Map<String, Object> general;
    private Map<String, Object> notifications;
    private Map<String, Object> appearance;

    public SettingsResponse() {}

    public SettingsResponse(Map<String, Object> general, Map<String, Object> notifications,
                            Map<String, Object> security, Map<String, Object> appearance,
                            Map<String, Object> backup) {
        this.general       = general;
        this.notifications = notifications;
        this.appearance    = appearance;
    }

    public Map<String, Object> getGeneral()       { return general; }
    public void setGeneral(Map<String, Object> general) { this.general = general; }

    public Map<String, Object> getNotifications() { return notifications; }
    public void setNotifications(Map<String, Object> notifications) { this.notifications = notifications; }

    public Map<String, Object> getAppearance()    { return appearance; }
    public void setAppearance(Map<String, Object> appearance) { this.appearance = appearance; }
}