"use client";

import { useState, useEffect } from "react";
import { usePageBuilder } from "@/lib/page-builder/context";
import { PageBuilderComponent, EditableField } from "@/lib/page-builder/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Palette,
  Layout,
  Type,
  X,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyPanel({ isOpen, onClose }: PropertyPanelProps) {
  const { selectedComponent, pageData, updateComponent, removeComponent, setSelectedComponent } =
    usePageBuilder();

  const [component, setComponent] = useState<PageBuilderComponent | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  // Find the selected component
  useEffect(() => {
    if (!selectedComponent || !pageData) {
      setComponent(null);
      return;
    }

    const findComponent = (components: PageBuilderComponent[]): PageBuilderComponent | null => {
      for (const comp of components) {
        if (comp.id === selectedComponent) {
          return comp;
        }
        if (comp.children) {
          const found = findComponent(comp.children);
          if (found) return found;
        }
      }
      return null;
    };

    let foundComponent: PageBuilderComponent | null = null;
    for (const section of pageData.sections) {
      foundComponent = findComponent(section.components);
      if (foundComponent) break;
    }

    setComponent(foundComponent);
    if (foundComponent) {
      setLocalValues({
        ...foundComponent.content,
        ...foundComponent.settings,
        ...foundComponent.styles,
      });
    }
  }, [selectedComponent, pageData]);

  if (!isOpen || !component) return null;

  const handleValueChange = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));

    // Update component immediately
    const contentKeys = ["text", "src", "alt", "href"];
    const settingsKeys = ["level", "variant", "size", "rounded"];

    if (contentKeys.includes(key)) {
      updateComponent(component.id, {
        content: { ...component.content, [key]: value },
      });
    } else if (settingsKeys.includes(key)) {
      updateComponent(component.id, {
        settings: { ...component.settings, [key]: value },
      });
    } else {
      updateComponent(component.id, {
        styles: { ...component.styles, [key]: value },
      });
    }
  };

  const duplicateComponent = () => {
    // Create a duplicate with new ID
    const duplicatedComponent: PageBuilderComponent = {
      ...component,
      id: `component-${Date.now()}`,
    };

    // Add to the same section (simplified)
    const firstSection = pageData?.sections[0];
    if (firstSection) {
      // This would need to be implemented in the context
      console.log("Duplicate component:", duplicatedComponent);
    }
  };

  const deleteComponent = () => {
    removeComponent(component.id);
    setSelectedComponent(null);
  };

  return (
    <div className="fixed bottom-0 right-0 top-16 z-40 w-80 border-l bg-white shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <Settings className="h-4 w-4" />
                Edit Component
              </h2>
              <p className="text-sm capitalize text-gray-500">{component.type}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Component Actions */}
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={duplicateComponent}>
              <Copy className="mr-1 h-3 w-3" />
              Duplicate
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteComponent}>
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">
                  <Type className="mr-1 h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="style">
                  <Palette className="mr-1 h-4 w-4" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Layout className="mr-1 h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="mt-4 space-y-4">
                {component.type === "heading" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="text">Heading Text</Label>
                      <Input
                        id="text"
                        value={localValues.text || ""}
                        onChange={(e) => handleValueChange("text", e.target.value)}
                        placeholder="Enter heading text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="level">Heading Level</Label>
                      <Select
                        value={localValues.level || "h2"}
                        onValueChange={(value) => handleValueChange("level", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h1">H1 - Main Title</SelectItem>
                          <SelectItem value="h2">H2 - Section</SelectItem>
                          <SelectItem value="h3">H3 - Subsection</SelectItem>
                          <SelectItem value="h4">H4 - Small Heading</SelectItem>
                          <SelectItem value="h5">H5 - Tiny Heading</SelectItem>
                          <SelectItem value="h6">H6 - Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {component.type === "paragraph" && (
                  <div className="space-y-2">
                    <Label htmlFor="text">Paragraph Text</Label>
                    <Textarea
                      id="text"
                      value={localValues.text || ""}
                      onChange={(e) => handleValueChange("text", e.target.value)}
                      placeholder="Enter paragraph text"
                      rows={4}
                    />
                  </div>
                )}

                {component.type === "text" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="text">Text Content</Label>
                      <Input
                        id="text"
                        value={localValues.text || ""}
                        onChange={(e) => handleValueChange("text", e.target.value)}
                        placeholder="Enter text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Text Size</Label>
                      <Select
                        value={localValues.size || "base"}
                        onValueChange={(value) => handleValueChange("size", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xs">Extra Small</SelectItem>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                          <SelectItem value="2xl">2X Large</SelectItem>
                          <SelectItem value="3xl">3X Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Font Weight</Label>
                      <Select
                        value={localValues.weight || "font-normal"}
                        onValueChange={(value) => handleValueChange("weight", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="font-light">Light</SelectItem>
                          <SelectItem value="font-normal">Normal</SelectItem>
                          <SelectItem value="font-medium">Medium</SelectItem>
                          <SelectItem value="font-semibold">Semibold</SelectItem>
                          <SelectItem value="font-bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {component.type === "image" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="src">Image URL</Label>
                      <Input
                        id="src"
                        value={localValues.src || ""}
                        onChange={(e) => handleValueChange("src", e.target.value)}
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alt">Alt Text</Label>
                      <Input
                        id="alt"
                        value={localValues.alt || ""}
                        onChange={(e) => handleValueChange("alt", e.target.value)}
                        placeholder="Describe the image"
                      />
                    </div>
                  </>
                )}

                {component.type === "button" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="text">Button Text</Label>
                      <Input
                        id="text"
                        value={localValues.text || ""}
                        onChange={(e) => handleValueChange("text", e.target.value)}
                        placeholder="Enter button text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="href">Link URL</Label>
                      <Input
                        id="href"
                        value={localValues.href || ""}
                        onChange={(e) => handleValueChange("href", e.target.value)}
                        placeholder="Enter URL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="variant">Button Style</Label>
                      <Select
                        value={localValues.variant || "default"}
                        onValueChange={(value) => handleValueChange("variant", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="destructive">Destructive</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="ghost">Ghost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Button Size</Label>
                      <Select
                        value={localValues.size || "default"}
                        onValueChange={(value) => handleValueChange("size", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sm">Small</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="lg">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Style Tab */}
              <TabsContent value="style" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Spacing</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-gray-500">Margin</Label>
                        <Input placeholder="0" className="text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Padding</Label>
                        <Input placeholder="0" className="text-sm" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Colors</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded border bg-gray-900"></div>
                        <Label className="text-xs">Text Color</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded border bg-transparent"></div>
                        <Label className="text-xs">Background</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Border</Label>
                    <div className="mt-2 space-y-2">
                      <Input placeholder="Border width" className="text-sm" />
                      <Select>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Border style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid">Solid</SelectItem>
                          <SelectItem value="dashed">Dashed</SelectItem>
                          <SelectItem value="dotted">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Layout</Label>
                    <div className="mt-2 space-y-2">
                      <Select>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Display" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="block">Block</SelectItem>
                          <SelectItem value="inline">Inline</SelectItem>
                          <SelectItem value="flex">Flex</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Visibility</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch id="visible" />
                        <Label htmlFor="visible" className="text-sm">
                          Visible
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Animation</Label>
                    <div className="mt-2 space-y-2">
                      <Select>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Entrance animation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fadeIn">Fade In</SelectItem>
                          <SelectItem value="slideUp">Slide Up</SelectItem>
                          <SelectItem value="scaleIn">Scale In</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="text-xs text-gray-500">
            <p className="mb-1 font-medium">Component ID</p>
            <p className="rounded border bg-white px-2 py-1 font-mono text-xs">{component.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
