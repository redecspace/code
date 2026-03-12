"use client";

import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, SUPPORT_EMAIL, WEB_DOMAIN } from "@/data/constants";

export default function PrivacyPage() {
  const lastUpdated = "March 11, 2026";

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Privacy <span className="text-primary">Policy</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Last Updated: {lastUpdated}</p>
      </div>

      <Card className="rounded border">
        <CardContent className="pt-8 space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold">1. Introduction</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              At {APP_NAME}, accessible from {WEB_DOMAIN}, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by {APP_NAME} and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
            </p>
          </section>

          <section className="space-y-3">
          <h2 className="text-lg font-bold">2. Local Processing (Client-Side)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most of the tools provided on {APP_NAME} operate entirely within your web browser. This means that your files, images, and data are processed locally on your device and are **never uploaded to our servers**. This applies to our PDF tools, Image tools, and most generators.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">3. Log Files</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {APP_NAME} follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">4. Cookies and Web Beacons</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Like any other website, {APP_NAME} uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">5. Advertising Partners</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Some of advertisers on our site may use cookies and web beacons. Each of our advertising partners has their own Privacy Policy for their policies on user data. To make it easier, we might link to their Privacy Policies below if applicable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">6. Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We take the security of your data seriously. Since the majority of our tools process data locally, we significantly reduce the risk of data breaches. For any data that is transmitted, we use industry-standard encryption protocols (HTTPS) to ensure its safety.
            </p>
          </section>

          <section className="space-y-3 border-t pt-6">
            <h2 className="text-lg font-bold">7. Contact Us</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at: <span className="font-semibold text-foreground">{SUPPORT_EMAIL}</span>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
