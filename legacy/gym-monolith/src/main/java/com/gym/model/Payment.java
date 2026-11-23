package com.gym.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "payments",
    indexes = {
        @Index(name = "idx_payment_gym_id", columnList = "gym_id"),
        @Index(name = "idx_payment_date", columnList = "payment_date")
    }
)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id")
    private Long gymId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "member_id")
    private Long memberId;

    private Double amount;
    private String plan;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    private String status;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;

    public Payment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getGymId() { return gymId; }
    public void setGymId(Long gymId) { this.gymId = gymId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate paymentDate) { this.paymentDate = paymentDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
}