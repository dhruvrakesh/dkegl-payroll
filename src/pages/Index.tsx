
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Calculator, 
  FileText, 
  TrendingUp, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Building2,
  Mail,
  Phone
} from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Comprehensive employee database with departments, units, and roles"
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Advanced attendance management with CSV upload and Sunday overtime handling"
    },
    {
      icon: Calculator,
      title: "Payroll Processing",
      description: "Automated salary calculations with PF, ESI, and pro-rated components"
    },
    {
      icon: FileText,
      title: "Leave Management",
      description: "Complete leave balance tracking with automated deductions"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Comprehensive reporting and analytics for informed decision making"
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with role-based access control"
    }
  ];

  const benefits = [
    "Automated payroll processing saves 80% of time",
    "Real-time attendance tracking and validation",
    "Comprehensive leave management system",
    "Advanced employee search and filtering",
    "Bulk operations for efficient data management",
    "Detailed audit trails and compliance reporting"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">DK Enterprises</h1>
              <p className="text-sm text-muted-foreground">Payroll Management System</p>
            </div>
          </div>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Enterprise Payroll Solution
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Complete Payroll Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your HR operations with our comprehensive payroll system featuring 
            automated calculations, attendance tracking, and advanced leave management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="group" asChild>
              <a href="/auth">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to manage payroll efficiently and accurately
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose Our System?</h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8">
              <div className="text-center space-y-6">
                <Clock className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Save Time & Money</h3>
                  <p className="text-muted-foreground">
                    Automate your payroll processes and reduce manual errors by up to 95%
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">80%</div>
                    <div className="text-sm text-muted-foreground">Time Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">95%</div>
                    <div className="text-sm text-muted-foreground">Error Reduction</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of companies that trust our payroll system
          </p>
          <Button size="lg" variant="secondary" className="group" asChild>
            <a href="/auth">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold">DK Enterprises</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Professional payroll management solutions for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Employee Management</li>
                <li>Attendance Tracking</li>
                <li>Payroll Processing</li>
                <li>Leave Management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Contact</li>
                <li>Support</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@dkenterprises.co.in
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +91 12345 67890
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 DK Enterprises. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
