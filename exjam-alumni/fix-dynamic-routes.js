const fs = require('fs');
const path = require('path');

// List of API routes that need the dynamic export
const routesToFix = [
  '/app/api/admin/analytics/route.ts',
  '/app/api/admin/site-config/route.ts',
  '/app/api/admin/messages/route.ts',
  '/app/api/admin/messages/[id]/route.ts',
  '/app/api/admin/messages/[id]/read/route.ts',
  '/app/api/admin/messages/[id]/reply/route.ts',
  '/app/api/admin/payments/stats/route.ts',
  '/app/api/analytics/dashboard/route.ts',
  '/app/api/admin/export/route.ts',
  '/app/api/admin/export/download/[jobId]/route.ts',
  '/app/api/admin/payments/route.ts',
  '/app/api/admin/payments/[paymentId]/verify/route.ts',
  '/app/api/admin/communications/messages/route.ts'
];

const baseDir = '/Users/goldmay/exjam-alumni-research/exjam-alumni';

routesToFix.forEach(routePath => {
  const fullPath = path.join(baseDir, routePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the dynamic export already exists
    if (!content.includes("export const dynamic = 'force-dynamic'")) {
      // Find the import statements
      const importMatch = content.match(/(import[\s\S]*?)\n\nexport/);
      
      if (importMatch) {
        // Add the dynamic export after imports
        content = content.replace(
          importMatch[0],
          `${importMatch[1]}\n\nexport const dynamic = 'force-dynamic';\n\nexport`
        );
      } else {
        // If no clear pattern, add at the beginning after imports
        const lines = content.split('\n');
        let lastImportIndex = 0;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        lines.splice(lastImportIndex + 1, 0, '', "export const dynamic = 'force-dynamic';");
        content = lines.join('\n');
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed: ${routePath}`);
    } else {
      console.log(`⏭️  Already fixed: ${routePath}`);
    }
  } else {
    console.log(`❌ Not found: ${routePath}`);
  }
});

console.log('\n✨ Dynamic route fixes completed!');