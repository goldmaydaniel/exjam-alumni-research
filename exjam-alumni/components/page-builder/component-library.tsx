"use client";

import { useState } from "react";
import { usePageBuilder } from "@/lib/page-builder/context";
import { ComponentDefinition, PageBuilderComponent } from "@/lib/page-builder/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Type,
  Heading,
  AlignLeft,
  Image as ImageIcon,
  Square,
  Layout,
  MousePointer,
  Sparkles,
  Search,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const componentLibrary: ComponentDefinition[] = [
  {
    type: "heading",
    name: "Heading",
    icon: "Heading",
    category: "text",
    defaultContent: { text: "Your Heading Here" },
    defaultStyles: { fontSize: "2xl", fontWeight: "bold" },
    defaultSettings: { level: "h2" },
    editableFields: [
      { key: "text", label: "Text", type: "text", placeholder: "Enter heading text" },
      {
        key: "level",
        label: "Heading Level",
        type: "select",
        options: ["h1", "h2", "h3", "h4", "h5", "h6"],
      },
    ],
  },
  {
    type: "paragraph",
    name: "Paragraph",
    icon: "AlignLeft",
    category: "text",
    defaultContent: {
      text: "Your paragraph text goes here. Click to edit and customize the content.",
    },
    defaultStyles: { fontSize: "base", color: "text-gray-600" },
    defaultSettings: {},
    editableFields: [
      { key: "text", label: "Text", type: "textarea", placeholder: "Enter paragraph text" },
    ],
  },
  {
    type: "text",
    name: "Text",
    icon: "Type",
    category: "text",
    defaultContent: { text: "Click to edit text" },
    defaultStyles: {},
    defaultSettings: {},
    editableFields: [
      { key: "text", label: "Text", type: "text", placeholder: "Enter text" },
      {
        key: "size",
        label: "Size",
        type: "select",
        options: ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"],
      },
      {
        key: "weight",
        label: "Weight",
        type: "select",
        options: ["font-light", "font-normal", "font-medium", "font-semibold", "font-bold"],
      },
    ],
  },
  {
    type: "image",
    name: "Image",
    icon: "ImageIcon",
    category: "media",
    defaultContent: { src: "", alt: "Image" },
    defaultStyles: { width: "full" },
    defaultSettings: { rounded: true },
    editableFields: [
      { key: "src", label: "Image URL", type: "text", placeholder: "Enter image URL" },
      { key: "alt", label: "Alt Text", type: "text", placeholder: "Describe the image" },
    ],
  },
  {
    type: "button",
    name: "Button",
    icon: "MousePointer",
    category: "interactive",
    defaultContent: { text: "Click me", href: "#" },
    defaultStyles: {},
    defaultSettings: { variant: "default", size: "default" },
    editableFields: [
      { key: "text", label: "Button Text", type: "text", placeholder: "Enter button text" },
      { key: "href", label: "Link URL", type: "text", placeholder: "Enter URL" },
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: ["default", "destructive", "outline", "secondary", "ghost"],
      },
      { key: "size", label: "Size", type: "select", options: ["sm", "default", "lg"] },
    ],
  },
  {
    type: "spacer",
    name: "Spacer",
    icon: "Layout",
    category: "layout",
    defaultContent: {},
    defaultStyles: { height: "4" },
    defaultSettings: {},
    editableFields: [
      {
        key: "height",
        label: "Height",
        type: "select",
        options: ["1", "2", "4", "8", "12", "16", "20"],
      },
    ],
  },
];

interface ComponentLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComponentLibrary({ isOpen, onClose }: ComponentLibraryProps) {
  const { addComponent, pageData } = usePageBuilder();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  const categories = ["all", "text", "media", "layout", "interactive"];

  const filteredComponents = componentLibrary.filter((component) => {
    const matchesSearch = component.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || component.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addComponentToPage = (componentDef: ComponentDefinition) => {
    // Find the first section or create one
    const firstSection = pageData?.sections[0];
    if (!firstSection) return;

    const newComponent: PageBuilderComponent = {
      id: `component-${Date.now()}`,
      type: componentDef.type,
      content: componentDef.defaultContent,
      styles: componentDef.defaultStyles,
      settings: componentDef.defaultSettings,
    };

    addComponent(firstSection.id, newComponent);
  };

  const IconComponent = ({ iconName }: { iconName: string }) => {
    const icons = {
      Type,
      Heading,
      AlignLeft,
      ImageIcon,
      MousePointer,
      Layout,
      Square,
    };
    const Icon = icons[iconName as keyof typeof icons] || Square;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black bg-opacity-50">
      {/* Side Panel */}
      <div className="h-full w-80 bg-white shadow-2xl">
        <div className="border-b p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5" />
              Component Library
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="border-b p-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Components */}
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {filteredComponents.map((component) => (
              <Card
                key={component.type}
                className="hover:scale-102 cursor-pointer transition-all duration-200 hover:shadow-md"
                onClick={() => addComponentToPage(component)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <IconComponent iconName={component.icon} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{component.name}</h3>
                      <p className="text-xs capitalize text-gray-500">{component.category}</p>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Tips */}
        <div className="border-t bg-gray-50 p-4">
          <div className="text-xs text-gray-600">
            <p className="mb-1 font-medium">💡 Quick Tips:</p>
            <ul className="space-y-1">
              <li>• Click components to add them to your page</li>
              <li>• Use search to find specific components</li>
              <li>• Filter by category for better organization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Overlay - Close on click */}
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
}
