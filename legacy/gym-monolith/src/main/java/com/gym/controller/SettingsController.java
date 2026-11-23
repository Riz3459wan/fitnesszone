package com.gym.controller;

import com.gym.dto.SettingsRequest;
import com.gym.dto.SettingsResponse;
import com.gym.dto.ApiResponse;
import com.gym.service.SettingsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsService settingsService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getSettings() {
        try {
            SettingsResponse settings = settingsService.getSettings();
            return ResponseEntity.ok(ApiResponse.success("Settings retrieved successfully", settings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to load settings: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> saveSettings(@RequestBody SettingsRequest request) {
        try {
            SettingsResponse savedSettings = settingsService.saveSettings(request);
            return ResponseEntity.ok(ApiResponse.success("Settings saved successfully", savedSettings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to save settings: " + e.getMessage()));
        }
    }

    @PostMapping("/reset")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> resetSettings() {
        try {
            settingsService.resetSettings();
            SettingsResponse settings = settingsService.getSettings();
            return ResponseEntity.ok(ApiResponse.success("Settings reset successfully", settings));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to reset settings"));
        }
    }
}