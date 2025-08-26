"use client";

// Footer Preview Component - For Testing Responsive Layout
export function FooterPreview() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Footer Mobile Improvements</h2>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">📱 Mobile (&lt; 640px)</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✅ Logo increased from 32x32 to 56x56px</li>
            <li>✅ Logo + title centered with flex-col layout</li>
            <li>✅ Added "Ex-Junior Airmen" subtitle</li>
            <li>✅ All content sections centered</li>
            <li>✅ Social icons with rounded backgrounds</li>
            <li>✅ Improved padding and spacing</li>
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">💻 Tablet (640px+)</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✅ 2-column grid layout</li>
            <li>✅ Logo + title horizontal alignment</li>
            <li>✅ Left-aligned text sections</li>
            <li>✅ Contact section spans 2 columns</li>
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 text-sm font-semibold">🖥️ Desktop (1024px+)</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✅ 3-column grid layout</li>
            <li>✅ Each section in its own column</li>
            <li>✅ Optimized spacing and typography</li>
            <li>✅ Enhanced visual hierarchy</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-2 text-sm font-semibold">🎨 Visual Enhancements</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>✅ Logo shadow for better visual prominence</li>
          <li>✅ Rounded-full badges with better colors</li>
          <li>✅ Added "Alumni Network" badge</li>
          <li>✅ Social icons with hover effects</li>
          <li>✅ Enhanced copyright section with motto</li>
          <li>✅ Better contrast and readability</li>
        </ul>
      </div>
    </div>
  );
}
