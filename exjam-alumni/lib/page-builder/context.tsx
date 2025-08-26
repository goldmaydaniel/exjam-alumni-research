"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import {
  PageBuilderContextType,
  PageBuilderData,
  PageBuilderComponent,
  PageBuilderSection,
} from "./types";

const PageBuilderContext = createContext<PageBuilderContextType | null>(null);

export function usePageBuilder() {
  const context = useContext(PageBuilderContext);
  if (!context) {
    throw new Error("usePageBuilder must be used within a PageBuilderProvider");
  }
  return context;
}

interface PageBuilderProviderProps {
  children: ReactNode;
  initialData?: PageBuilderData;
  pageSlug: string;
}

export function PageBuilderProvider({ children, initialData, pageSlug }: PageBuilderProviderProps) {
  const [isEditMode, setEditMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [pageData, setPageData] = useState<PageBuilderData | null>(initialData || null);
  const [isDragging, setIsDragging] = useState(false);

  const updateComponent = useCallback(
    (componentId: string, updates: Partial<PageBuilderComponent>) => {
      if (!pageData) return;

      const updateComponentInSection = (
        components: PageBuilderComponent[]
      ): PageBuilderComponent[] => {
        return components.map((component) => {
          if (component.id === componentId) {
            return { ...component, ...updates };
          }
          if (component.children) {
            return {
              ...component,
              children: updateComponentInSection(component.children),
            };
          }
          return component;
        });
      };

      const updatedSections = pageData.sections.map((section) => ({
        ...section,
        components: updateComponentInSection(section.components),
      }));

      setPageData({
        ...pageData,
        sections: updatedSections,
        meta: {
          ...pageData.meta,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [pageData]
  );

  const addComponent = useCallback(
    (sectionId: string, component: PageBuilderComponent, index?: number) => {
      if (!pageData) return;

      const updatedSections = pageData.sections.map((section) => {
        if (section.id === sectionId) {
          const newComponents = [...section.components];
          if (index !== undefined) {
            newComponents.splice(index, 0, component);
          } else {
            newComponents.push(component);
          }
          return { ...section, components: newComponents };
        }
        return section;
      });

      setPageData({
        ...pageData,
        sections: updatedSections,
        meta: {
          ...pageData.meta,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [pageData]
  );

  const removeComponent = useCallback(
    (componentId: string) => {
      if (!pageData) return;

      const removeFromComponents = (components: PageBuilderComponent[]): PageBuilderComponent[] => {
        return components
          .filter((component) => component.id !== componentId)
          .map((component) => ({
            ...component,
            children: component.children ? removeFromComponents(component.children) : undefined,
          }));
      };

      const updatedSections = pageData.sections.map((section) => ({
        ...section,
        components: removeFromComponents(section.components),
      }));

      setPageData({
        ...pageData,
        sections: updatedSections,
        meta: {
          ...pageData.meta,
          updatedAt: new Date().toISOString(),
        },
      });

      // Clear selection if removed component was selected
      if (selectedComponent === componentId) {
        setSelectedComponent(null);
      }
    },
    [pageData, selectedComponent]
  );

  const addSection = useCallback(
    (section: PageBuilderSection, index?: number) => {
      if (!pageData) return;

      const newSections = [...pageData.sections];
      if (index !== undefined) {
        newSections.splice(index, 0, section);
      } else {
        newSections.push(section);
      }

      setPageData({
        ...pageData,
        sections: newSections,
        meta: {
          ...pageData.meta,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [pageData]
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      if (!pageData) return;

      const updatedSections = pageData.sections.filter((section) => section.id !== sectionId);

      setPageData({
        ...pageData,
        sections: updatedSections,
        meta: {
          ...pageData.meta,
          updatedAt: new Date().toISOString(),
        },
      });
    },
    [pageData]
  );

  const savePage = useCallback(async () => {
    if (!pageData) return;

    try {
      const response = await fetch(`/api/page-builder/${pageSlug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        throw new Error("Failed to save page");
      }

      // Show success toast
      console.log("Page saved successfully");
    } catch (error) {
      console.error("Error saving page:", error);
      // Show error toast
    }
  }, [pageData, pageSlug]);

  const publishPage = useCallback(async () => {
    if (!pageData) return;

    const publishedData = {
      ...pageData,
      meta: {
        ...pageData.meta,
        status: "published" as const,
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch(`/api/page-builder/${pageSlug}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(publishedData),
      });

      if (!response.ok) {
        throw new Error("Failed to publish page");
      }

      setPageData(publishedData);
      console.log("Page published successfully");
    } catch (error) {
      console.error("Error publishing page:", error);
    }
  }, [pageData, pageSlug]);

  const value: PageBuilderContextType = {
    isEditMode,
    setEditMode,
    selectedComponent,
    setSelectedComponent,
    pageData,
    setPageData,
    updateComponent,
    addComponent,
    removeComponent,
    addSection,
    removeSection,
    isDragging,
    setIsDragging,
    savePage,
    publishPage,
  };

  return <PageBuilderContext.Provider value={value}>{children}</PageBuilderContext.Provider>;
}
