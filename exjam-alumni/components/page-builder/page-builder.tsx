"use client";

import { useState, useEffect } from "react";
import { PageBuilderProvider, usePageBuilder } from "@/lib/page-builder/context";
import { PageBuilderData, PageBuilderSection } from "@/lib/page-builder/types";
import { EditToolbar } from "./edit-toolbar";
import { ComponentLibrary } from "./component-library";
import { PropertyPanel } from "./property-panel";
import { RenderComponent } from "./editable-components";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageBuilderProps {
  children?: React.ReactNode;
  pageSlug: string;
  initialData?: PageBuilderData;
  allowEditing?: boolean;
  fallbackContent?: React.ReactNode;
}

function PageBuilderContent({
  children,
  pageSlug,
  allowEditing = true,
  fallbackContent,
}: Omit<PageBuilderProps, "initialData">) {
  const { isEditMode, setEditMode, pageData, setPageData, selectedComponent, addSection } =
    usePageBuilder();

  const [showComponentLibrary, setShowComponentLibrary] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  // Check if user has edit permissions (in real app, check user role)
  const canEdit = allowEditing; // You'd check user permissions here

  useEffect(() => {
    setShowPropertyPanel(!!selectedComponent);
  }, [selectedComponent]);

  // Initialize with sample data if empty
  useEffect(() => {
    if (!pageData) {
      const sampleData: PageBuilderData = {
        id: `page-${pageSlug}`,
        title: `${pageSlug} Page`,
        slug: pageSlug,
        sections: [
          {
            id: `section-${Date.now()}`,
            components: [],
            styles: {},
            settings: {
              backgroundColor: "bg-white",
              padding: "py-8",
              fullWidth: false,
            },
          },
        ],
        meta: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "current-user",
          status: "draft",
        },
      };
      setPageData(sampleData);
    }
  }, [pageData, pageSlug, setPageData]);

  const handleAddSection = () => {
    const newSection: PageBuilderSection = {
      id: `section-${Date.now()}`,
      components: [],
      styles: {},
      settings: {
        backgroundColor: "bg-white",
        padding: "py-8",
        fullWidth: false,
      },
    };
    addSection(newSection);
  };

  const handleEditToggle = () => {
    if (!canEdit) return;
    setEditMode(!isEditMode);
  };

  // Render fallback content if no page data
  if (!pageData && fallbackContent) {
    return (
      <div className="relative">
        {canEdit && (
          <div className="fixed right-4 top-4 z-50">
            <Button onClick={handleEditToggle}>
              <Settings className="mr-2 h-4 w-4" />
              Edit Page
            </Button>
          </div>
        )}
        {fallbackContent}
      </div>
    );
  }

  // Render original children if not in edit mode and children provided
  if (!isEditMode && children) {
    return (
      <div className="relative">
        {canEdit && (
          <div className="fixed right-4 top-4 z-50">
            <Button onClick={handleEditToggle} variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Edit Page
            </Button>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Edit Mode UI */}
      {isEditMode && canEdit && (
        <>
          <EditToolbar />
          <ComponentLibrary
            isOpen={showComponentLibrary}
            onClose={() => setShowComponentLibrary(false)}
          />
          <PropertyPanel isOpen={showPropertyPanel} onClose={() => setShowPropertyPanel(false)} />
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          isEditMode && "pt-20", // Add top padding for toolbar
          showPropertyPanel && "pr-80" // Add right padding for property panel
        )}
      >
        {pageData ? (
          // Render page builder content
          <div className="min-h-screen">
            {pageData.sections.map((section, sectionIndex) => (
              <section
                key={section.id}
                className={cn(
                  "relative",
                  section.settings.backgroundColor || "bg-white",
                  section.settings.padding || "py-8",
                  section.settings.fullWidth ? "w-full" : "container mx-auto px-4"
                )}
              >
                {/* Section Components */}
                {section.components.length > 0 ? (
                  <div className="space-y-4">
                    {section.components.map((component) => (
                      <RenderComponent key={component.id} component={component} />
                    ))}
                  </div>
                ) : isEditMode ? (
                  // Empty section placeholder
                  <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                    <div className="text-center">
                      <Plus className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <h3 className="mb-2 text-lg font-medium">Add Your First Component</h3>
                      <p className="mb-4 text-sm">Click to open the component library</p>
                      <Button onClick={() => setShowComponentLibrary(true)} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Component
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Add Section Button */}
                {isEditMode && sectionIndex === pageData.sections.length - 1 && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={handleAddSection}
                      variant="outline"
                      size="lg"
                      className="border-dashed"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          // Render original content as fallback
          children || (
            <div className="flex min-h-screen items-center justify-center">
              <div className="text-center">
                <h2 className="mb-4 text-2xl font-bold">Welcome to Page Builder</h2>
                <p className="mb-6 text-gray-600">Start creating your page by adding components</p>
                <Button onClick={() => setShowComponentLibrary(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Get Started
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Quick Actions */}
      {isEditMode && canEdit && (
        <div className="fixed bottom-4 left-4 z-50 space-y-2">
          <Button
            onClick={() => setShowComponentLibrary(true)}
            size="lg"
            className="rounded-full shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Component
          </Button>
        </div>
      )}

      {/* Exit Edit Mode */}
      {!canEdit && isEditMode && (
        <div className="fixed right-4 top-4 z-50">
          <Button onClick={() => setEditMode(false)} variant="outline">
            Exit Edit Mode
          </Button>
        </div>
      )}
    </div>
  );
}

export function PageBuilder({
  children,
  pageSlug,
  initialData,
  allowEditing = true,
  fallbackContent,
}: PageBuilderProps) {
  return (
    <PageBuilderProvider initialData={initialData} pageSlug={pageSlug}>
      <PageBuilderContent
        pageSlug={pageSlug}
        allowEditing={allowEditing}
        fallbackContent={fallbackContent}
      >
        {children}
      </PageBuilderContent>
    </PageBuilderProvider>
  );
}
