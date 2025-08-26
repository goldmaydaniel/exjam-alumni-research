/**
 * Script to automatically update all imports to use consolidated auth
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

const projectRoot = process.cwd();

// Files to update
const filesToUpdate = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
];

const updateImports = () => {
  console.log("🔄 Consolidating authentication imports...\n");

  let updatedFiles = 0;

  filesToUpdate.forEach((pattern) => {
    const files = glob.sync(pattern, { cwd: projectRoot });

    files.forEach((filePath) => {
      const fullPath = path.join(projectRoot, filePath);

      // Skip the consolidated auth file itself
      if (filePath.includes("consolidated-auth.ts")) return;

      try {
        let content = fs.readFileSync(fullPath, "utf8");
        let modified = false;

        // Replace useAuthStore imports
        if (
          content.includes("from '@/lib/store/useAuthStore'") ||
          content.includes('from "@/lib/store/useAuthStore"')
        ) {
          content = content.replace(
            /from ['"]@\/lib\/store\/useAuthStore['"];?/g,
            "from '@/lib/store/consolidated-auth';"
          );
          modified = true;
          console.log(`  ✅ Updated useAuthStore import in: ${filePath}`);
        }

        // Replace useSupabaseAuth imports
        if (
          content.includes("from '@/lib/store/useSupabaseAuth'") ||
          content.includes('from "@/lib/store/useSupabaseAuth"')
        ) {
          content = content.replace(
            /from ['"]@\/lib\/store\/useSupabaseAuth['"];?/g,
            "from '@/lib/store/consolidated-auth';"
          );
          modified = true;
          console.log(`  ✅ Updated useSupabaseAuth import in: ${filePath}`);
        }

        // Update the actual usage - change both to useAuth
        if (content.includes("useAuthStore") || content.includes("useSupabaseAuth")) {
          // Replace useAuthStore() calls with useAuth()
          content = content.replace(/useAuthStore\(/g, "useAuth(");
          // Replace useSupabaseAuth() calls with useAuth()
          content = content.replace(/useSupabaseAuth\(/g, "useAuth(");

          // Update imports to include useAuth
          if (!content.includes("import { useAuth")) {
            if (content.includes("import { useAuthStore")) {
              content = content.replace(/import \{ useAuthStore/g, "import { useAuth");
            } else if (content.includes("import { useSupabaseAuth")) {
              content = content.replace(/import \{ useSupabaseAuth/g, "import { useAuth");
            }
          }

          modified = true;
          console.log(`  ✅ Updated function calls in: ${filePath}`);
        }

        // Write back if modified
        if (modified) {
          fs.writeFileSync(fullPath, content, "utf8");
          updatedFiles++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
      }
    });
  });

  console.log(`\n✅ Consolidation complete! Updated ${updatedFiles} files.`);
  console.log("\n📋 Summary of changes:");
  console.log("  • All useAuthStore imports → useAuth from consolidated-auth");
  console.log("  • All useSupabaseAuth imports → useAuth from consolidated-auth");
  console.log("  • All function calls updated to use unified interface");
  console.log("  • Backward compatibility maintained for legacy methods\n");

  console.log("🔄 Next steps:");
  console.log("  1. Test the authentication flow");
  console.log("  2. Remove old auth store files once testing is complete");
  console.log("  3. Update any remaining manual imports\n");
};

// Install glob if not available, then run
try {
  require("glob");
  updateImports();
} catch (error) {
  console.log("📦 Installing glob package...");
  const { execSync } = require("child_process");

  try {
    execSync("npm install glob --save-dev", { stdio: "inherit" });
    console.log("✅ Glob installed, running consolidation...\n");

    // Re-require and run
    delete require.cache[require.resolve("glob")];
    updateImports();
  } catch (installError) {
    console.error("❌ Failed to install glob. Please run: npm install glob --save-dev");
    console.log("\n📝 Manual update needed for the following patterns:");
    console.log("  Replace: import { useAuthStore } from '@/lib/store/useAuthStore'");
    console.log("  With:    import { useAuth } from '@/lib/store/consolidated-auth'");
    console.log("  Replace: import { useSupabaseAuth } from '@/lib/store/useSupabaseAuth'");
    console.log("  With:    import { useAuth } from '@/lib/store/consolidated-auth'");
    console.log("  Replace: useAuthStore() → useAuth()");
    console.log("  Replace: useSupabaseAuth() → useAuth()");
  }
}
