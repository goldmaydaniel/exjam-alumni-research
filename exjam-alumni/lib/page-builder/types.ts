export interface PageBuilderComponent {
  id: string;
  type: string;
  content: Record<string, any>;
  styles: Record<string, any>;
  settings: Record<string, any>;
  children?: PageBuilderComponent[];
}

export interface PageBuilderSection {
  id: string;
  components: PageBuilderComponent[];
  styles: Record<string, any>;
  settings: {
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    fullWidth?: boolean;
  };
}

export interface PageBuilderData {
  id: string;
  title: string;
  slug: string;
  sections: PageBuilderSection[];
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    status: "draft" | "published";
  };
}

export interface ComponentDefinition {
  type: string;
  name: string;
  icon: string;
  category: "text" | "media" | "layout" | "interactive";
  defaultContent: Record<string, any>;
  defaultStyles: Record<string, any>;
  defaultSettings: Record<string, any>;
  editableFields: EditableField[];
}

export interface EditableField {
  key: string;
  label: string;
  type: "text" | "textarea" | "rich-text" | "number" | "color" | "select" | "image" | "toggle";
  options?: string[];
  placeholder?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

export interface PageBuilderContextType {
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  selectedComponent: string | null;
  setSelectedComponent: (id: string | null) => void;
  pageData: PageBuilderData | null;
  setPageData: (data: PageBuilderData) => void;
  updateComponent: (componentId: string, updates: Partial<PageBuilderComponent>) => void;
  addComponent: (sectionId: string, component: PageBuilderComponent, index?: number) => void;
  removeComponent: (componentId: string) => void;
  addSection: (section: PageBuilderSection, index?: number) => void;
  removeSection: (sectionId: string) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  savePage: () => Promise<void>;
  publishPage: () => Promise<void>;
}
