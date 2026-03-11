"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, SUPPORT_EMAIL, SOCIAL_HANDLE } from "@/data/constants";
import { Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function ContactPage() {
  const contactMethods = [
    {
      title: "Email Support",
      description: "For technical issues, bug reports, or general inquiries.",
      value: SUPPORT_EMAIL,
      icon: Mail,
      action: () => window.location.href = `mailto:${SUPPORT_EMAIL}`,
      label: "Send Email",
    },
    {
      title: "Twitter / X",
      description: "Follow us for updates and quick support via DM.",
      value: SOCIAL_HANDLE,
      icon: FaTwitter,
      action: () => window.open(`https://twitter.com/${SOCIAL_HANDLE.replace('@', '')}`, '_blank'),
      label: "Follow Us",
    },
    {
      title: "Instagram",
      description: "Check our latest features and platform updates.",
      value: SOCIAL_HANDLE,
      icon: FaInstagram,
      action: () => window.open(`https://instagram.com/${SOCIAL_HANDLE.replace('@', '')}`, '_blank'),
      label: "Follow Us",
    },
    {
      title: "LinkedIn",
      description: "Connect with us for professional inquiries.",
      value: "company/redecspace",
      icon: FaLinkedin,
      action: () => window.open(`https://linkedin.com/company/${SOCIAL_HANDLE.replace('@', '')}`, '_blank'),
      label: "Connect",
    }
  ];

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Get in <span className="text-primary">Touch</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Have a question, feedback, or a tool suggestion? We'd love to hear from you. Our team is dedicated to making {APP_NAME} the best tool platform on the web.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {contactMethods.map((method, i) => (
          <Card key={i} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="p-2 rounded bg-primary/10 text-primary">
                <method.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold">{method.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {method.description}
              </p>
              {/* <div className="pt-2"> */}
                <p className="text-sm font-medium mb-6">{method.value}</p>

         <Button onClick={method.action} variant="default" className="w-full rounded font-bold uppercase tracking-wider h-10">
                  {method.label}
                </Button>
              {/* </div> */}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded border bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-start">
            <div className="p-2 rounded bg-background border mt-1">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Collaborations & Partnerships</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Interested in integrating our tools or proposing a partnership? Please reach out directly to our support email with "Partnership" in the subject line. We're always open to interesting projects and collaborations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
