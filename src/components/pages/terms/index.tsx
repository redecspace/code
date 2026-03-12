"use client";

import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME, WEB_DOMAIN } from "@/data/constants";

export default function TermsPage() {
  const lastUpdated = "March 11, 2026";

  return (
    <div className="max-w-5xl mr-auto animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold font-display">
          Terms of <span className="text-primary">Service</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Last Updated: {lastUpdated}</p>
      </div>

      <Card className="rounded border">
        <CardContent className="pt-8 space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-bold">1. Agreement to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing our website at {WEB_DOMAIN}, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">2. Use License</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Permission is granted to temporarily use the tools on {APP_NAME} for personal, non-commercial or commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
              <li>Modify or copy the materials (except where intended by the tool's functionality).</li>
              <li>Attempt to decompile or reverse engineer any software contained on {APP_NAME}.</li>
              <li>Remove any copyright or other proprietary notations from the materials.</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">3. Disclaimer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The tools on {APP_NAME} are provided on an 'as is' basis. {APP_NAME} makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">4. Limitations</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In no event shall {APP_NAME} or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the tools on {APP_NAME}, even if {APP_NAME} or a {APP_NAME} authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="space-y-3">
                <h2 className="text-lg font-bold">5. Data and Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While we strive to process all data locally on your device, you are responsible for the content you process using our tools. You must ensure that you have the necessary rights to any data or files you process on our platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">6. Accuracy of Materials</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The materials appearing on {APP_NAME} could include technical, typographical, or photographic errors. {APP_NAME} does not warrant that any of the materials on its website are accurate, complete or current. {APP_NAME} may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section className="space-y-3 border-t pt-6">
            <h2 className="text-lg font-bold">7. Governing Law</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
