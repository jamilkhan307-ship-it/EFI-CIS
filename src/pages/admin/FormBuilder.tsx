import { useState, useEffect } from "react";
import { GripVertical, Settings2, Plus, Lock, Eye, EyeOff, X, Trash2, Save } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import type { FormSectionConfig, FormFieldConfig } from "../../types";
import { FALLBACK_FORM_CONFIG } from "../../lib/fallback-form-config";

type FieldType = FormFieldConfig["fieldType"];

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "decimal", label: "Decimal" },
  { value: "date", label: "Date Picker" },
  { value: "textarea", label: "Text Area" },
  { value: "rich-text", label: "Rich Text Area" },
  { value: "dropdown", label: "Dropdown" },
  { value: "toggle", label: "Toggle (Yes/No)" },
  { value: "checkbox", label: "Checkbox" },
  { value: "file", label: "File Upload" },
];

export default function FormBuilder() {
  const [sections, setSections] = useState<FormSectionConfig[]>(FALLBACK_FORM_CONFIG);
  const [activeSectionId, setActiveSectionId] = useState<string>("A");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [overrideCounts, setOverrideCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Modal state
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [fieldForm, setFieldForm] = useState({
    fieldId: "",
    fieldLabel: "",
    fieldType: "text" as FieldType,
    isMandatory: false,
    isRestricted: false,
    helpText: "",
    options: "",
  });

  const activeSection = sections.find(s => s.sectionId === activeSectionId);

  // Fetch per-section override counts & form config
  useEffect(() => {
    const fetchConfigAndOverrides = async () => {
      try {
        // Fetch saved form config
        const { data: configData, error: configError } = await supabase
          .from("form_config")
          .select("sections")
          .eq("id", "default")
          .single();
        
        if (!configError && configData?.sections) {
          setSections(configData.sections as FormSectionConfig[]);
        }

        // Fetch overrides
        const { data: overrideData, error: overrideError } = await supabase
          .from("section_access_overrides")
          .select("overrides");
        
        if (!overrideError) {
          const counts: Record<string, number> = {};
          (overrideData || []).forEach((row: any) => {
            const overrides = row.overrides as Record<string, string> | undefined;
            if (overrides) {
              Object.entries(overrides).forEach(([sectionId, level]) => {
                if (level !== "role_default") {
                  counts[sectionId] = (counts[sectionId] || 0) + 1;
                }
              });
            }
          });
          setOverrideCounts(counts);
        }
      } catch (e) {
        console.error("Error fetching config", e);
      }
    };
    fetchConfigAndOverrides();
  }, []);

  // ---------- Publish to Supabase ----------
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const { error } = await supabase
        .from("form_config")
        .upsert({
          id: "default",
          sections: sections,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setSaveMessage("Published successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (e) {
      console.error("Error publishing config", e);
      setSaveMessage("Error publishing — check console.");
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Section toggles ----------
  const toggleSectionVisibility = (sectionId: string) => {
    setSections(sections.map(s =>
      s.sectionId === sectionId ? { ...s, isVisible: !s.isVisible } : s
    ));
  };

  const toggleFieldProperty = (sectionId: string, fieldId: string, property: keyof FormFieldConfig) => {
    setSections(sections.map(s => {
      if (s.sectionId === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => {
            if (f.fieldId === fieldId) {
              if (f.isSystemLocked && (property === 'isActive' || property === 'isMandatory')) return f;
              return { ...f, [property]: !f[property] };
            }
            return f;
          })
        };
      }
      return s;
    }));
  };

  // ---------- Add Custom Field ----------
  const resetFieldForm = () => {
    setFieldForm({ fieldId: "", fieldLabel: "", fieldType: "text", isMandatory: false, isRestricted: false, helpText: "", options: "" });
  };

  const openAddField = () => {
    resetFieldForm();
    setEditingField(null);
    setShowAddField(true);
  };

  const openEditField = (field: FormFieldConfig) => {
    setEditingField(field);
    setFieldForm({
      fieldId: field.fieldId,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType as FieldType,
      isMandatory: field.isMandatory,
      isRestricted: field.isRestricted,
      helpText: field.helpText || "",
      options: (field.options || []).join(", "),
    });
    setShowAddField(true);
  };

  const handleFieldSave = () => {
    if (!activeSection) return;
    if (!fieldForm.fieldId.trim() || !fieldForm.fieldLabel.trim()) {
      alert("Field ID and Label are required.");
      return;
    }

    const newField: FormFieldConfig = {
      fieldId: fieldForm.fieldId.trim().replace(/\s+/g, "_").toLowerCase(),
      fieldLabel: fieldForm.fieldLabel.trim(),
      fieldType: fieldForm.fieldType,
      isMandatory: fieldForm.isMandatory,
      isActive: true,
      isRestricted: fieldForm.isRestricted,
      isSystemLocked: false,
      helpText: fieldForm.helpText,
      displayOrder: activeSection.fields.length + 1,
      options: fieldForm.options ? fieldForm.options.split(",").map(o => o.trim()).filter(Boolean) : undefined,
    };

    setSections(sections.map(s => {
      if (s.sectionId !== activeSection.sectionId) return s;

      if (editingField) {
        // Edit existing
        return {
          ...s,
          fields: s.fields.map(f => f.fieldId === editingField.fieldId ? { ...newField, displayOrder: f.displayOrder, isSystemLocked: f.isSystemLocked } : f)
        };
      } else {
        // Check duplicate
        if (s.fields.some(f => f.fieldId === newField.fieldId)) {
          alert("A field with this ID already exists in this section.");
          return s;
        }
        return { ...s, fields: [...s.fields, newField] };
      }
    }));

    setShowAddField(false);
    resetFieldForm();
    setEditingField(null);
  };

  // ---------- Delete field ----------
  const handleDeleteField = (sectionId: string, fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;
    setSections(sections.map(s => {
      if (s.sectionId !== sectionId) return s;
      return { ...s, fields: s.fields.filter(f => f.fieldId !== fieldId) };
    }));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings2 className="mr-3 h-6 w-6 text-primary" />
            Dynamic Form Builder
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure CIR form sections, fields, and access restrictions at runtime.</p>
        </div>
        <div className="flex items-center space-x-3">
          {saveMessage && (
            <span className={"text-sm font-medium " + (saveMessage.includes("Error") ? "text-red-600" : "text-green-600")}>{saveMessage}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Publishing..." : "Publish Changes"}
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="flex-1 flex gap-6 overflow-hidden">

        {/* Left Panel */}
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Form Sections ({sections.length})</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {sections.map((section) => (
              <li
                key={section.sectionId}
                onClick={() => setActiveSectionId(section.sectionId)}
                className={"p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between " + (activeSectionId === section.sectionId ? "bg-blue-50/50 border-l-4 border-accent" : "border-l-4 border-transparent")}
              >
                <div className="flex items-center">
                  <GripVertical className="h-4 w-4 text-gray-400 mr-2 cursor-grab active:cursor-grabbing" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">Section {section.sectionId}: {section.sectionLabel}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{section.fields.length} Fields</span>
                      {(overrideCounts[section.sectionId] || 0) > 0 ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate("/admin/section-access"); }}
                          className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full hover:bg-amber-200 transition-colors"
                        >
                          {overrideCounts[section.sectionId]} override(s)
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Default Access</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(section.sectionId); }}
                  className={"p-1.5 rounded-full " + (section.isVisible ? "text-green-600 bg-green-100 hover:bg-green-200" : "text-gray-400 bg-gray-100 hover:bg-gray-200")}
                  aria-label={section.isVisible ? "Section Visible" : "Section Hidden"}
                >
                  {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {activeSection ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-900">
                  Editing: Section {activeSection.sectionId} ({activeSection.sectionLabel}) — {activeSection.fields.length} fields
                </h2>
                <button
                  onClick={openAddField}
                  className="inline-flex items-center text-sm font-medium text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded-md shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Custom Field
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                  {activeSection.fields.map((field) => (
                    <div key={field.fieldId} className={"border rounded-lg p-3 flex items-center justify-between " + (field.isActive ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50 opacity-75")}>
                      <div className="flex items-center w-1/2">
                        <GripVertical className="h-4 w-4 text-gray-400 mr-3 cursor-grab" />
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{field.fieldLabel}</span>
                            {field.isSystemLocked && (
                              <span title="System Locked Field" className="flex items-center">
                                <Lock className="h-3 w-3 text-red-500 ml-2" />
                              </span>
                            )}
                            {field.isRestricted && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">Restricted</span>}
                          </div>
                          <span className="text-xs text-gray-500 mt-1 font-mono">{field.fieldId} • {field.fieldType}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        {/* Mandatory Toggle */}
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 mb-1">Mandatory</span>
                          <button
                            disabled={field.isSystemLocked}
                            onClick={() => toggleFieldProperty(activeSection.sectionId, field.fieldId, 'isMandatory')}
                            className={"relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none " + (field.isMandatory ? "bg-primary" : "bg-gray-200") + (field.isSystemLocked ? " opacity-50 cursor-not-allowed" : "")}
                          >
                            <span className={"pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (field.isMandatory ? "translate-x-4" : "translate-x-0")} />
                          </button>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex flex-col items-center">
                          <span className="text-xs text-gray-500 mb-1">Active</span>
                          <button
                            disabled={field.isSystemLocked}
                            onClick={() => toggleFieldProperty(activeSection.sectionId, field.fieldId, 'isActive')}
                            className={"relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none " + (field.isActive ? "bg-green-500" : "bg-gray-200") + (field.isSystemLocked ? " opacity-50 cursor-not-allowed" : "")}
                          >
                            <span className={"pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out " + (field.isActive ? "translate-x-4" : "translate-x-0")} />
                          </button>
                        </div>

                        <button
                          onClick={() => openEditField(field)}
                          className="text-primary hover:text-accent font-medium text-sm ml-4 border-l pl-4 border-gray-200"
                        >
                          Edit
                        </button>

                        {!field.isSystemLocked && (
                          <button
                            onClick={() => handleDeleteField(activeSection.sectionId, field.fieldId)}
                            className="text-red-400 hover:text-red-600 ml-2"
                            title="Delete field"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a section to manage its fields.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {showAddField && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={() => setShowAddField(false)} />
            <div className="relative transform overflow-hidden rounded-lg bg-white px-6 pb-6 pt-5 text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingField ? "Edit Field" : "Add Custom Field"}
                </h3>
                <button onClick={() => setShowAddField(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field ID</label>
                    <input
                      type="text"
                      value={fieldForm.fieldId}
                      onChange={(e) => setFieldForm({ ...fieldForm, fieldId: e.target.value })}
                      disabled={!!editingField}
                      placeholder="e.g. customField1"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                    <input
                      type="text"
                      value={fieldForm.fieldLabel}
                      onChange={(e) => setFieldForm({ ...fieldForm, fieldLabel: e.target.value })}
                      placeholder="e.g. Custom Field Name"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                  <select
                    value={fieldForm.fieldType}
                    onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value as FieldType })}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                  >
                    {FIELD_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Help Text</label>
                  <input
                    type="text"
                    value={fieldForm.helpText}
                    onChange={(e) => setFieldForm({ ...fieldForm, helpText: e.target.value })}
                    placeholder="Displayed below the field as hint..."
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                  />
                </div>

                {fieldForm.fieldType === "dropdown" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma separated)</label>
                    <input
                      type="text"
                      value={fieldForm.options}
                      onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                      placeholder="Option 1, Option 2, Option 3"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-primary sm:text-sm px-3"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-6 pt-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={fieldForm.isMandatory}
                      onChange={() => setFieldForm({ ...fieldForm, isMandatory: !fieldForm.isMandatory })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                    />
                    Mandatory
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={fieldForm.isRestricted}
                      onChange={() => setFieldForm({ ...fieldForm, isRestricted: !fieldForm.isRestricted })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                    />
                    Restricted (Hidden from Engineering)
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddField(false)}
                  className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFieldSave}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
                >
                  {editingField ? "Update Field" : "Add Field"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
