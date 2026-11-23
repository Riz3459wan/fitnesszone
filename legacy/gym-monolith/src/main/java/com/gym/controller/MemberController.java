package com.gym.controller;

import com.gym.model.Member;
import com.gym.service.MemberService;
import com.gym.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getAllMembers(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        List<Member> members;
        if (startDate != null && endDate != null) {
            members = memberService.getMembersByDateRange(LocalDate.parse(startDate), LocalDate.parse(endDate));
        } else {
            members = memberService.getAllMembers();
        }
        return ResponseEntity.ok(ApiResponse.success("Members retrieved successfully", members));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> getMemberById(@PathVariable Long id) {
        Member member = memberService.getMemberById(id);
        if (member != null)
            return ResponseEntity.ok(ApiResponse.success("Member found", member));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Member not found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> createMember(@RequestBody Member member) {
        Member saved = memberService.createMember(member);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Member created successfully", saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> updateMember(@PathVariable Long id, @RequestBody Member member) {
        Member updated = memberService.updateMember(id, member);
        if (updated != null)
            return ResponseEntity.ok(ApiResponse.success("Member updated successfully", updated));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Member not found"));
    }

    // NEW: Status update endpoint
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> updateMemberStatus(
            @PathVariable Long id,
            @RequestParam Boolean active) {
        Member updated = memberService.updateMemberStatus(id, active);
        if (updated != null) {
            String message = active ? "Member activated successfully" : "Member deactivated successfully";
            return ResponseEntity.ok(ApiResponse.success(message, updated));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Member not found"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN')")
    public ResponseEntity<ApiResponse> deleteMember(@PathVariable Long id) {
        boolean deleted = memberService.deleteMember(id);
        if (deleted)
            return ResponseEntity.ok(ApiResponse.success("Member deleted successfully", null));
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Member not found"));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'TRAINER')")
    public ResponseEntity<ApiResponse> searchMembers(@RequestParam String term) {
        List<Member> members = memberService.searchMembers(term);
        return ResponseEntity.ok(ApiResponse.success("Search results", members));
    }
}