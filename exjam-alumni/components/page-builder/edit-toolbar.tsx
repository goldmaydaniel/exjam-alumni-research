"use client";

import { useState } from "react";
import { usePageBuilder } from "@/lib/page-builder/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Edit3,
  Eye,
  Save,
  Upload,
  Undo,
  Redo,
  Settings,
  Layers,
  Plus,
  Smartphone,
  Tablet,
  Monitor,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function EditToolbar() {
  const { isEditMode, setEditMode, pageData, savePage, publishPage, selectedComponent } =
    usePageBuilder();

  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (!isEditMode) return null;

  const handleSave = async () => {
    await savePage();
  };

  const handlePublish = async () => {
    await publishPage();
  };

  return (
    <>
      {/* Main Toolbar */}
      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 transform">
        <Card className="border-2 shadow-2xl">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {/* Page Status */}
              <div className="flex items-center gap-2 pr-3">
                <Badge variant={pageData?.meta.status === "published" ? "default" : "secondary"}>
                  {pageData?.meta.status === "published" ? "Published" : "Draft"}
                </Badge>
                <span className="text-xs text-gray-500">{pageData?.title}</span>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Edit Mode Toggle */}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!isEditMode)}
                className="flex items-center gap-1"
              >
                {isEditMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isEditMode ? "Editing" : "Preview"}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" disabled>
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <Redo className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Responsive Preview */}
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "tablet" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("tablet")}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Tools */}
              <div className="flex items-center gap-1">
                <Button
                  variant={showComponentLibrary ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowComponentLibrary(!showComponentLibrary)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
                  <Layers className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Palette className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Save & Publish */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4" />
                  Publish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Responsive Wrapper */}
      <div
        className={cn(
          "mx-auto border-4 border-blue-200 bg-white shadow-lg transition-all duration-300",
          viewMode === "desktop" && "max-w-full",
          viewMode === "tablet" && "max-w-2xl",
          viewMode === "mobile" && "max-w-sm"
        )}
      >
        {/* This wrapper will contain the page content */}
      </div>

      {/* Selected Component Indicator */}
      {selectedComponent && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Component Selected</span>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
