import { AppShell } from '@/components/layout/AppShell';
import { OnboardingContent } from '@/components/onboarding/OnboardingContent';
import { BrandMark } from '@/components/ui/BrandMark';

export default function OnboardingPage() {
  return (
    <AppShell>
      <BrandMark />
      <OnboardingContent />
    </AppShell>
  );
}
