import { createStorage, StorageEnum } from "../base/index";

interface SOAPTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SOAPTemplatesState {
  templates: SOAPTemplate[];
  selectedTemplateId: string | null;
}

const storage = createStorage<SOAPTemplatesState>(
  "soap-templates-storage-key",
  {
    templates: [], // Will be populated with default templates on first run
    selectedTemplateId: null,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const soapTemplatesStorage = {
  ...storage,

  addTemplate: async (
    template: Omit<SOAPTemplate, "id" | "createdAt" | "updatedAt">,
  ) => {
    await storage.set((currentState) => {
      const newTemplate: SOAPTemplate = {
        ...template,
        id: `template-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        ...currentState,
        templates: [...currentState.templates, newTemplate],
      };
    });
  },

  updateTemplate: async (
    id: string,
    updates: Partial<Omit<SOAPTemplate, "id" | "createdAt">>,
  ) => {
    await storage.set((currentState) => ({
      ...currentState,
      templates: currentState.templates.map((template) =>
        template.id === id
          ? {
              ...template,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : template,
      ),
    }));
  },

  deleteTemplate: async (id: string) => {
    await storage.set((currentState) => ({
      ...currentState,
      templates: currentState.templates.filter(
        (template) => template.id !== id,
      ),
      selectedTemplateId:
        currentState.selectedTemplateId === id
          ? null
          : currentState.selectedTemplateId,
    }));
  },

  getTemplateById: async (id: string): Promise<SOAPTemplate | undefined> => {
    const state = await storage.get();
    return state.templates.find((template) => template.id === id);
  },

  getTemplatesByCategory: async (category: string): Promise<SOAPTemplate[]> => {
    const state = await storage.get();
    return state.templates.filter((template) => template.category === category);
  },

  setSelectedTemplate: async (id: string | null) => {
    await storage.set((currentState) => ({
      ...currentState,
      selectedTemplateId: id,
    }));
  },

  initializeDefaultTemplates: async () => {
    const state = await storage.get();
    if (state.templates.length === 0) {
      // Import and add default templates
      const { defaultTemplates } =
        await import("../templates/default-templates");
      await storage.set({
        templates: defaultTemplates,
        selectedTemplateId: null,
      });
    }
  },
};

export type { SOAPTemplate, SOAPTemplatesState };
