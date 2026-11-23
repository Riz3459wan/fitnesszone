package com.gym.controller;

import com.gym.dto.UserRequest;
import com.gym.dto.UserResponse;
import com.gym.dto.ChangePasswordRequest;
import com.gym.dto.ApiResponse;
import com.gym.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        if (user != null) {
            return ResponseEntity.ok(ApiResponse.success("User found", user));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("User not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> createUser(@RequestBody UserRequest userRequest) {
        UserResponse createdUser = userService.createUser(userRequest);
        if (createdUser != null) {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User created successfully", createdUser));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error("Username or email already exists"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> updateUser(@PathVariable Long id, @RequestBody UserRequest userRequest) {
        UserResponse updatedUser = userService.updateUser(id, userRequest);
        if (updatedUser != null) {
            return ResponseEntity.ok(ApiResponse.success("User updated successfully", updatedUser));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("User not found or email already exists"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody ChangePasswordRequest request) {
        boolean changed = userService.changePassword(
            request.getUserId(),
            request.getCurrentPassword(),
            request.getNewPassword()
        );
        if (changed) {
            return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Invalid current password or user not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> searchUsers(@RequestParam String keyword) {
        List<UserResponse> users = userService.searchUsers(keyword);
        return ResponseEntity.ok(ApiResponse.success("Search results", users));
    }
}