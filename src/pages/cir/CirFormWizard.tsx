import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const cirSchema = z.object({
  cirNumber: z.string().min(1, "CIR Number is required"),
  status: z.string(),
  formData: z.record(z.string(), z.any())
});

type WizardFormValues = z.infer<typeof cirSchema>;
import { useNavigate, useParams } from "react-router-dom";
import { Check, ChevronRight, Save, UploadCloud, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import type { FormSectionConfig, FormFieldConfig, SectionAccessLevel } from "../../types";
import { FALLBACK_FORM_CONFIG } from "../../lib/fallback-form-config";

export default function CirFormWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  
  // Dynamic Config State
  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  // Section access overrides for the current user
  const [userOverrides, setUserOverrides] = useState<Record<string, SectionAccessLevel>>({});
  
  // Master Data State
  
  const [customers, setCustomers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [ppapLevels, setPpapLevels] = useState<string[]>([]);
  const [packagingTypes, setPackagingTypes] = useState<string[]>([]);

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const methods = useForm<WizardFormValues>({
    resolver: zodResolver(cirSchema),
    defaultValues: {
      cirNumber: id || `CIS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "DRAFT",
      formData: {}
    }
  });

  const { handleSubmit, watch, register, setValue, reset } = methods;
  const values = watch();

  useEffect(() => {
    if (id) {
      const fetchDraft = async () => {
        const { data, error } = await supabase.from("cir_records").select("*").eq("cir_number", id).single();
        if (data && !error) {
          reset({
            cirNumber: data.cir_number,
            status: data.status,
            formData: data.form_data || {}
          });
        }
      };
      fetchDraft();
    }
  }, [id, reset]);

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const { data: custData } = await supabase.from("master_customers").select("name").eq("is_active", true);
        if (custData && custData.length > 0) setCustomers(custData.map((c: { name: string }) => c.name));
        else setCustomers(["Mahindra & Mahindra", "TATA Motors", "Ashok Leyland", "Escorts Kubota", "Force Motors"]);
        
        const { data: catData } = await supabase.from("master_categories").select("name").eq("is_active", true);
        if (catData && catData.length > 0) setCategories(catData.map((c: { name: string }) => c.name));
        else setCategories(["Propshaft Assembly", "CV Joint", "Clutch Assembly", "Differential Component", "Drive Axle", "Gear", "Bearing", "Seal"]);

        const { data: matData } = await supabase.from("master_materials").select("name").eq("is_active", true);
        if (matData && matData.length > 0) setMaterials(matData.map((c: { name: string }) => c.name));
        else setMaterials(["ASTM A536 65-45-12", "SAE 1020", "SAE 4140", "Aluminum A356-T6", "Cast Iron EN-GJL-250"]);

        const { data: ppapData } = await supabase.from("master_ppap_levels").select("name").eq("is_active", true);
        if (ppapData && ppapData.length > 0) setPpapLevels(ppapData.map((c: { name: string }) => c.name));
        else setPpapLevels(["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]);

        const { data: packData } = await supabase.from("master_packaging").select("name").eq("is_active", true);
        if (packData && packData.length > 0) setPackagingTypes(packData.map((c: { name: string }) => c.name));
        else setPackagingTypes(["Plastic Bin (Reusable)", "Wooden Pallet", "Corrugated Box", "VCI Bag + Carton", "Steel Rack"]);

      } catch (e) {
        console.error("Error fetching master data, using fallbacks", e);
        setCustomers(["Mahindra & Mahindra", "TATA Motors", "Ashok Leyland", "Escorts Kubota", "Force Motors"]);
        setCategories(["Propshaft Assembly", "CV Joint", "Clutch Assembly", "Differential Component", "Drive Axle", "Gear", "Bearing", "Seal"]);
        setMaterials(["ASTM A536 65-45-12", "SAE 1020", "SAE 4140", "Aluminum A356-T6", "Cast Iron EN-GJL-250"]);
        setPpapLevels(["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"]);
        setPackagingTypes(["Plastic Bin (Reusable)", "Wooden Pallet", "Corrugated Box", "VCI Bag + Carton", "Steel Rack"]);
      }
      
      try {
        const { data: configData, error: configError } = await supabase
          .from("form_config")
          .select("sections")
          .eq("id", "default")
          .single();
          
        if (!configError && configData?.sections) {
          setFormConfig(configData.sections as FormSectionConfig[]);
        } else {
          setFormConfig(FALLBACK_FORM_CONFIG);
        }
      } catch (e) {
        setFormConfig(FALLBACK_FORM_CONFIG);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch user-specific section access overrides
  useEffect(() => {
    if (!user) return;
    // Super Admin always gets full access
    if (user.role === "SUPER_ADMIN") return;

    const fetchOverrides = async () => {
      try {
        const { data, error } = await supabase
          .from("section_access_overrides")
          .select("overrides")
          .eq("user_id", user.uid)
          .single();
        if (!error && data) {
          setUserOverrides((data.overrides as Record<string, SectionAccessLevel>) || {});
        }
      } catch (e) {
        console.error("Error fetching section overrides", e);
      }
    };
    fetchOverrides();
  }, [user]);

  // Compute visible sections (filter out no_access and hidden sections)
  const visibleSections = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") return formConfig.filter(s => s.isVisible);
    return formConfig.filter(s => {
      if (!s.isVisible) return false;
      const override = userOverrides[s.sectionId];
      if (override === "no_access") return false;
      return true;
    });
  }, [formConfig, userOverrides, user]);

  // Determine if a section is view-only for this user
  const isSectionViewOnly = (sectionId: string): boolean => {
    if (user?.role === "SUPER_ADMIN") return false;
    const override = userOverrides[sectionId];
    return override === "view_only";
  };

  // Auto-save draft every 60s - Stable dependency logic
  useEffect(() => {
    const interval = setInterval(() => {
      // Access current values via ref-like behavior or just the closure
      // Using a helper to avoid re-creating interval on every keystroke
      document.dispatchEvent(new CustomEvent("trigger-autosave"));
    }, 60000);
    
    const listener = () => handleSaveDraft();
    document.addEventListener("trigger-autosave", listener);

    return () => {
      clearInterval(interval);
      document.removeEventListener("trigger-autosave", listener);
    };
  }, []); // Only once on mount

  const handleSaveDraft = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const draftId = values.cirNumber || `draft-${Date.now()}`;
      const { error } = await supabase
        .from("cir_records")
        .upsert({
          cir_number: draftId,
          status: "DRAFT",
          initiator_id: user.uid,
          initiator_name: user.name,
          form_data: values.formData || {},
          updated_at: new Date().toISOString()
        }, { onConflict: "cir_number" });
        
        if (error) throw error;
        setLastSaved(new Date());
    } catch (e: any) {
      console.warn("[AUTOSAVE] Failed silently to prevent UI hang:", e.message);
      setSaveError("Auto-save failed. Check connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: WizardFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("cir_records")
        .upsert({
          cir_number: data.cirNumber,
          status: "SUBMITTED",
          initiator_id: user.uid,
          initiator_name: user.name,
          form_data: data.formData || {},
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          version: 1
        }, { onConflict: "cir_number" });
      if (error) throw error;
      navigate("/cir");
    } catch (e: any) {
      console.error("Submission failed", e);
      alert("Submission failed: " + (e.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const maxDim = 600;
          if (width > maxDim || height > maxDim) {
            if (width > height) { height = Math.round(height * (maxDim / width)); width = maxDim; }
            else { width = Math.round(width * (maxDim / height)); height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          let quality = 0.8;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          // 50KB approximate limit check
          while (dataUrl.length * 0.75 > 50000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          setValue(`formData.${fieldId}` as any, dataUrl, { shouldDirty: true });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setValue(`formData.${fieldId}` as any, event.target?.result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderDynamicField = (field: FormFieldConfig, readOnly: boolean) => {
    // Hidden from Engineering check
    if (field.isRestricted && user?.role === "ENGINEERING") return null;
    if (!field.isActive) return null;

    // If section is read-only, waive mandatory requirements
    const isRequired = readOnly ? false : field.isMandatory;
    const commonClasses = "mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3";
    const readOnlyClasses = "mt-2 block w-full rounded-md border-0 py-1.5 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-100 sm:text-sm sm:leading-6 px-3 cursor-not-allowed";

    switch(field.fieldType) {
      case "text":
      case "number":
      case "decimal":
      case "date":
        return (
          <div className="sm:col-span-3" key={field.fieldId}>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              {field.fieldLabel} {isRequired && "*"}
            </label>
            <input 
              type={field.fieldType === "decimal" ? "number" : field.fieldType} 
              step={field.fieldType === "decimal" ? "0.01" : undefined}
              readOnly={readOnly || field.fieldId === "cirNumber"}
              disabled={readOnly}
              {...register(("formData." + field.fieldId) as any, { required: isRequired })} 
              className={readOnly || field.fieldId === "cirNumber" ? readOnlyClasses : commonClasses} 
              placeholder={field.helpText}
            />
          </div>
        );
      
      case "textarea":
      case "rich-text":
        return (
          <div className="sm:col-span-full" key={field.fieldId}>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              {field.fieldLabel} {isRequired && "*"}
            </label>
            <textarea 
              rows={3}
              readOnly={readOnly}
              disabled={readOnly}
              {...register(("formData." + field.fieldId) as any, { required: isRequired })} 
              className={readOnly ? readOnlyClasses : commonClasses} 
              placeholder={field.helpText}
            />
          </div>
        );

      case "dropdown":
        // Determine options dynamically or statically
        let dropdownOptions = field.options || [];
        if (field.fieldId === "customerName") dropdownOptions = customers;
        else if (field.fieldId === "partCategory") dropdownOptions = categories;
        else if (field.fieldId === "materialSpecification") dropdownOptions = materials;
        else if (field.fieldId === "ppapRequirement") dropdownOptions = ppapLevels;
        else if (field.fieldId === "packagingType") dropdownOptions = packagingTypes;

        return (
          <div className="sm:col-span-3" key={field.fieldId}>
            <label className="block text-sm font-medium leading-6 text-gray-900">
              {field.fieldLabel} {isRequired && "*"}
            </label>
            <select 
              disabled={readOnly}
              {...register(("formData." + field.fieldId) as any, { required: isRequired })} 
              className={readOnly ? readOnlyClasses : commonClasses}
            >
              <option value="">Select {field.fieldLabel}</option>
              {dropdownOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );

      case "file":
        return (
            <div className="sm:col-span-full" key={field.fieldId}>
             <label className="block text-sm font-medium leading-6 text-gray-900">{field.fieldLabel} {isRequired && "*"}</label>
             {readOnly ? (
               <div className="mt-2 rounded-lg border border-dashed border-gray-300 px-6 py-6 bg-gray-100 text-center text-sm text-gray-400">
                 {values.formData?.[field.fieldId] ? "File attached." : "No file attached."}
               </div>
             ) : (
               <div className="mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 bg-gray-50 hover:bg-gray-100 transition-colors">
                 <div className="text-center">
                   <UploadCloud className="mx-auto h-12 w-12 text-gray-300" />
                   <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                     <label className="relative cursor-pointer rounded-md bg-transparent font-semibold text-primary hover:text-accent">
                       <span>Upload a file</span>
                       <input 
                         type="file" 
                         className="sr-only" 
                         accept="image/*,.pdf,.doc,.docx"
                         onChange={(e) => {
                           handleFileUpload(e, field.fieldId);
                         }} 
                       />
                     </label>
                     <p className="pl-1">or drag and drop</p>
                   </div>
                   <p className="text-xs leading-5 text-gray-600">Images are auto-compressed (Max 50KB).</p>
                 </div>
                 {values.formData?.[field.fieldId] && (
                   <div className="mt-4 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      File ready: ~{Math.round((values.formData[field.fieldId].length * 0.75) / 1024)} KB
                   </div>
                 )}
               </div>
             )}
          </div>
        );
        
      case "checkbox":
      case "toggle":
        return (
          <div className="sm:col-span-full" key={field.fieldId}>
            <div className="relative flex items-start mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex h-6 items-center">
                <input type="checkbox" disabled={readOnly} {...register(("formData." + field.fieldId) as any, { required: isRequired })} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label className="font-medium text-gray-900">{field.fieldLabel} {isRequired && "*"}</label>
                <p className="text-gray-500">{field.helpText}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentSection = visibleSections[currentStep];

  const renderSection = () => {
    if (!currentSection) return null;
    const viewOnly = isSectionViewOnly(currentSection.sectionId);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Section {currentSection.sectionId}: {currentSection.sectionLabel}
          </h3>
          {viewOnly && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              View Only
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
          {currentSection.fields.map(f => renderDynamicField(f, viewOnly))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New CIS Form</h1>
        <div className="flex items-center space-x-4 mt-2 h-5">
          {isSaving && <span className="text-xs text-blue-600 animate-pulse font-medium">Autosaving...</span>}
          {!isSaving && lastSaved && <span className="text-xs text-gray-400 font-medium">Last saved: {lastSaved.toLocaleTimeString()}</span>}
          {saveError && <span className="text-xs text-red-500 font-medium">{saveError}</span>}
        </div>
      </div>

      {isLoadingConfig ? (
        <div className="flex justify-center items-center h-64 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-gray-500 font-medium">Loading form configuration...</span>
        </div>
      ) : (
        <>

      <div className="lg:border-b lg:border-t lg:border-gray-200 mb-8 bg-white shadow-sm rounded-lg lg:rounded-none">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Progress">
          <ol role="list" className="overflow-hidden rounded-md lg:flex lg:rounded-none lg:border-l lg:border-r lg:border-gray-200">
            {visibleSections.map((step, stepIdx) => (
              <li key={step.sectionId} className="relative overflow-hidden lg:flex-1">
                <div className={`border-b-0 border-t-0 p-3 sm:p-4
                  ${currentStep > stepIdx ? 'bg-green-50/30' : currentStep === stepIdx ? 'bg-primary/5' : ''}`}>
                  <span className="flex items-center text-sm font-medium">
                    <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 
                      ${currentStep > stepIdx ? 'bg-green-600 border-green-600' : currentStep === stepIdx ? 'border-primary text-primary' : 'border-gray-300 text-gray-500'}`}>
                      {currentStep > stepIdx ? <Check className="h-5 w-5 text-white" /> : step.sectionId}
                    </span>
                    <span className={`ml-3 text-xs md:text-sm font-medium ${currentStep === stepIdx ? 'text-primary' : 'text-gray-500'}`}>
                      {step.sectionLabel}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            
            <div className="px-4 py-5 sm:p-6">
              {renderSection()}
            </div>

            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 sm:px-6 rounded-b-lg border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center outline-none bg-white font-medium text-sm text-gray-700 px-4 py-2 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                <Save className="mr-2 h-4 w-4" /> Save as Draft
              </button>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                
                {currentStep < visibleSections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent/90"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Submit for Review
                  </button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
        </>
      )}
    </div>
  );
}
