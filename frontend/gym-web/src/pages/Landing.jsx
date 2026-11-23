import React, { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Dumbbell,
  Users,
  CalendarCheck,
  CreditCard,
  Package,
  BarChart3,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X,
} from "lucide-react";

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = useMemo(
    () => [
      {
        icon: Users,
        title: "Member Management",
        description:
          "Easily manage all your members, track their progress, and maintain detailed profiles.",
      },
      {
        icon: CalendarCheck,
        title: "Attendance Tracking",
        description:
          "Check-in/check-out system with daily attendance reports and statistics.",
      },
      {
        icon: CreditCard,
        title: "Payment Processing",
        description:
          "Track payments, manage subscriptions, and generate invoices effortlessly.",
      },
      {
        icon: Package,
        title: "Membership Plans",
        description:
          "Create and manage multiple membership plans with different pricing tiers.",
      },
      {
        icon: BarChart3,
        title: "Analytics Dashboard",
        description:
          "Real-time insights into revenue, attendance, and member growth.",
      },
      {
        icon: Shield,
        title: "Secure & Reliable",
        description:
          "Your data is safe with enterprise-grade security and regular backups.",
      },
    ],
    [],
  );

  const pricingPlans = useMemo(
    () => [
      {
        name: "Starter",
        price: "49",
        period: "month",
        features: [
          "Up to 100 members",
          "Basic attendance tracking",
          "Payment management",
          "Email support",
          "Basic reports",
        ],
        highlighted: false,
      },
      {
        name: "Professional",
        price: "99",
        period: "month",
        features: [
          "Unlimited members",
          "Advanced attendance analytics",
          "Automated payment reminders",
          "Priority support",
          "Advanced reports & export",
          "Multiple membership plans",
          "Staff accounts (up to 5)",
        ],
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "199",
        period: "month",
        features: [
          "Everything in Professional",
          "Unlimited staff accounts",
          "Custom features development",
          "Dedicated account manager",
          "API access",
          "SLA guarantee",
          "On-premise deployment option",
        ],
        highlighted: false,
      },
    ],
    [],
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Rajesh Sharma",
        gym: "PowerFit Gym, Mumbai",
        text: "GymZora has transformed how we manage our gym. Attendance tracking and payment collection have become so much easier!",
        rating: 5,
      },
      {
        name: "Priya Patel",
        gym: "Yoga Wellness Studio, Bangalore",
        text: "The dashboard gives us real-time insights into our business. Highly recommended for any fitness business.",
        rating: 5,
      },
      {
        name: "Amit Kumar",
        gym: "Elite Fitness, Delhi",
        text: "Best investment we made for our gym. The support team is amazing and the software just works.",
        rating: 5,
      },
    ],
    [],
  );

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Dumbbell className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                GymZora
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-primary-600 transition"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-primary-600 transition"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-primary-600 transition"
              >
                Testimonials
              </a>
              <Link
                to="/login"
                className="text-gray-600 hover:text-primary-600 transition"
              >
                Login
              </Link>
              <Link to="/subscription" className="btn-primary">
                Start Free Trial
              </Link>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-4">
            <div className="flex flex-col space-y-3 px-4">
              <a
                href="#features"
                className="py-2 text-gray-600 hover:text-primary-600"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="py-2 text-gray-600 hover:text-primary-600"
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="py-2 text-gray-600 hover:text-primary-600"
              >
                Testimonials
              </a>
              <Link
                to="/login"
                className="py-2 text-gray-600 hover:text-primary-600"
              >
                Login
              </Link>
              <Link to="/register" className="btn-primary text-center">
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-primary-50 via-white to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Your Gym{" "}
            <span className="text-primary-600">Effortlessly</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
            The all-in-one gym management software that helps you track members,
            attendance, payments, and grow your fitness business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-3">
              Learn More
            </a>
          </div>
          <div className="mt-12 flex justify-center items-center gap-8 text-sm text-gray-500">
            <span className="flex items-center">✓ No credit card required</span>
            <span className="flex items-center">✓ 14-day free trial</span>
            <span className="flex items-center">✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600">500+</div>
              <div className="text-gray-600 mt-2">Gyms Trust Us</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">50K+</div>
              <div className="text-gray-600 mt-2">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">1M+</div>
              <div className="text-gray-600 mt-2">Check-ins Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600">99.9%</div>
              <div className="text-gray-600 mt-2">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Gym
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed specifically for gym owners and fitness
              professionals
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your gym's needs
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 ${plan.highlighted ? "bg-primary-600 text-white shadow-xl scale-105 md:scale-100" : "bg-gray-50 border border-gray-200"}`}
              >
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className="text-sm">/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle
                        className={`h-5 w-5 ${plan.highlighted ? "text-white" : "text-primary-600"}`}
                      />
                      <span
                        className={
                          plan.highlighted ? "text-white" : "text-gray-600"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/subscription"
                  className={`block text-center py-3 rounded-lg font-semibold transition ${plan.highlighted ? "bg-white text-primary-600 hover:bg-gray-100" : "bg-primary-600 text-white hover:bg-primary-700"}`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Gym Owners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers have to say about GymZora
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-900">
                  {testimonial.name}
                </p>
                <p className="text-sm text-gray-500">{testimonial.gym}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Gym?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join hundreds of gym owners who are already using GymZora
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center"
          >
            Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Dumbbell className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold">GymZora</span>
              </div>
              <p className="text-gray-400 text-sm">
                The complete gym management solution for modern fitness
                businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/demo" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            &copy; 2024 GymZora. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
