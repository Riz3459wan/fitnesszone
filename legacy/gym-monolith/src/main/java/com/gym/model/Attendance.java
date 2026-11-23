package com.gym.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "attendance",
    indexes = {
        @Index(name = "idx_attendance_gym_date", columnList = "gym_id, date"),
        @Index(name = "idx_attendance_member_id", columnList = "member_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_attendance_gym_member_date",
            columnNames = {"gym_id", "member_id", "date"}
        )
    }
)
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id")
    private Long gymId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "check_in")
    private String checkIn;

    @Column(name = "check_out")
    private String checkOut;

    private String status;
    private LocalDate date;

    public Attendance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getGymId() { return gymId; }
    public void setGymId(Long gymId) { this.gymId = gymId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }

    public String getCheckIn() { return checkIn; }
    public void setCheckIn(String checkIn) { this.checkIn = checkIn; }

    public String getCheckOut() { return checkOut; }
    public void setCheckOut(String checkOut) { this.checkOut = checkOut; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}