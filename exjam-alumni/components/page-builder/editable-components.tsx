"use client";

import { useState, useRef, useEffect } from "react";
import { usePageBuilder } from "@/lib/page-builder/context";
import { PageBuilderComponent } from "@/lib/page-builder/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Edit, Trash2, Copy, Move, Type, Image as ImageIcon, Layout, Square } from "lucide-react";

interface EditableWrapperProps {
  component: PageBuilderComponent;
  children: React.ReactNode;
  className?: string;
}

function EditableWrapper({ component, children, className }: EditableWrapperProps) {
  const { isEditMode, selectedComponent, setSelectedComponent, removeComponent } = usePageBuilder();

  const [isHovered, setIsHovered] = useState(false);
  const isSelected = selectedComponent === component.id;

  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isHovered && !isSelected && "ring-1 ring-blue-300 ring-offset-1",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedComponent(component.id);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Edit Controls */}
      {(isHovered || isSelected) && (
        <div className="absolute -top-8 left-0 z-10 flex items-center gap-1">
          <div className="rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white">
            {component.type}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Open property panel
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              // Duplicate component
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              removeComponent(component.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}

interface EditableTextProps {
  component: PageBuilderComponent;
}

export function EditableText({ component }: EditableTextProps) {
  const { isEditMode, updateComponent } = usePageBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(component.content.text || "Click to edit text");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateComponent(component.id, {
      content: { ...component.content, text },
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setText(component.content.text || "Click to edit text");
      setIsEditing(false);
    }
  };

  if (isEditing && isEditMode) {
    return (
      <EditableWrapper component={component}>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-lg font-semibold"
        />
      </EditableWrapper>
    );
  }

  const textSize = component.settings?.size || "base";
  const textColor = component.settings?.color || "text-gray-900";
  const fontWeight = component.settings?.weight || "font-normal";

  return (
    <EditableWrapper component={component}>
      <div
        className={cn(
          "cursor-text transition-all",
          `text-${textSize}`,
          textColor,
          fontWeight,
          isEditMode && "rounded px-2 py-1 hover:bg-gray-50"
        )}
        onClick={() => isEditMode && setIsEditing(true)}
      >
        {component.content.text || "Click to edit text"}
      </div>
    </EditableWrapper>
  );
}

export function EditableHeading({ component }: EditableTextProps) {
  const { isEditMode, updateComponent } = usePageBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(component.content.text || "Click to edit heading");
  const inputRef = useRef<HTMLInputElement>(null);

  const level = component.settings?.level || "h2";
  const HeadingTag = level as keyof JSX.IntrinsicElements;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateComponent(component.id, {
      content: { ...component.content, text },
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setText(component.content.text || "Click to edit heading");
      setIsEditing(false);
    }
  };

  if (isEditing && isEditMode) {
    return (
      <EditableWrapper component={component}>
        <Input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="text-2xl font-bold"
        />
      </EditableWrapper>
    );
  }

  return (
    <EditableWrapper component={component}>
      <HeadingTag
        className={cn(
          "cursor-text font-bold transition-all",
          level === "h1" && "text-4xl",
          level === "h2" && "text-3xl",
          level === "h3" && "text-2xl",
          level === "h4" && "text-xl",
          level === "h5" && "text-lg",
          level === "h6" && "text-base",
          isEditMode && "rounded px-2 py-1 hover:bg-gray-50"
        )}
        onClick={() => isEditMode && setIsEditing(true)}
      >
        {component.content.text || "Click to edit heading"}
      </HeadingTag>
    </EditableWrapper>
  );
}

export function EditableParagraph({ component }: EditableTextProps) {
  const { isEditMode, updateComponent } = usePageBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(component.content.text || "Click to edit paragraph text...");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateComponent(component.id, {
      content: { ...component.content, text },
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setText(component.content.text || "Click to edit paragraph text...");
      setIsEditing(false);
    }
  };

  if (isEditing && isEditMode) {
    return (
      <EditableWrapper component={component}>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] resize-y"
          placeholder="Enter your paragraph text..."
        />
      </EditableWrapper>
    );
  }

  return (
    <EditableWrapper component={component}>
      <p
        className={cn(
          "cursor-text leading-relaxed text-gray-600 transition-all",
          isEditMode && "rounded px-2 py-1 hover:bg-gray-50"
        )}
        onClick={() => isEditMode && setIsEditing(true)}
      >
        {component.content.text || "Click to edit paragraph text..."}
      </p>
    </EditableWrapper>
  );
}

export function EditableImage({ component }: EditableTextProps) {
  const { isEditMode, updateComponent } = usePageBuilder();
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Create a URL for preview (in real app, upload to storage)
    const imageUrl = URL.createObjectURL(file);

    updateComponent(component.id, {
      content: {
        ...component.content,
        src: imageUrl,
        alt: file.name,
      },
    });

    setIsUploading(false);
  };

  const imageSrc = component.content.src;
  const imageAlt = component.content.alt || "Image";

  return (
    <EditableWrapper component={component}>
      <div className="relative">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="h-auto w-full rounded-lg" />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-gray-100">
            <div className="text-center">
              <ImageIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No image selected</p>
            </div>
          </div>
        )}

        {isEditMode && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-50 opacity-0 transition-opacity hover:opacity-100">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button variant="secondary" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Change Image"}
              </Button>
            </label>
          </div>
        )}
      </div>
    </EditableWrapper>
  );
}

export function EditableButton({ component }: EditableTextProps) {
  const { isEditMode, updateComponent } = usePageBuilder();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(component.content.text || "Button Text");
  const [href, setHref] = useState(component.content.href || "#");
  const inputRef = useRef<HTMLInputElement>(null);

  const buttonVariant = component.settings?.variant || "default";
  const buttonSize = component.settings?.size || "default";

  const handleSave = () => {
    updateComponent(component.id, {
      content: { ...component.content, text, href },
    });
    setIsEditing(false);
  };

  if (isEditing && isEditMode) {
    return (
      <EditableWrapper component={component}>
        <div className="space-y-2 rounded border p-3">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Button text"
          />
          <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="Button link" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </EditableWrapper>
    );
  }

  return (
    <EditableWrapper component={component}>
      <Button
        variant={buttonVariant as any}
        size={buttonSize as any}
        onClick={() => (isEditMode ? setIsEditing(true) : window.open(href, "_blank"))}
        className="transition-all"
      >
        {component.content.text || "Button Text"}
      </Button>
    </EditableWrapper>
  );
}

// Component renderer
export function RenderComponent({ component }: { component: PageBuilderComponent }) {
  switch (component.type) {
    case "text":
      return <EditableText component={component} />;
    case "heading":
      return <EditableHeading component={component} />;
    case "paragraph":
      return <EditableParagraph component={component} />;
    case "image":
      return <EditableImage component={component} />;
    case "button":
      return <EditableButton component={component} />;
    default:
      return (
        <EditableWrapper component={component}>
          <div className="border border-dashed border-gray-300 p-4 text-center text-gray-500">
            Unknown component type: {component.type}
          </div>
        </EditableWrapper>
      );
  }
}
