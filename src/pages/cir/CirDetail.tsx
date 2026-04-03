import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { CheckCircle, XCircle, CornerUpLeft, Clock, FileText, ChevronDown, ChevronRight, Download, Loader2, FileSpreadsheet, MessageSquare, Pencil } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "../../lib/supabase";
import { FALLBACK_FORM_CONFIG } from "../../lib/fallback-form-config";
import type { FormSectionConfig, SectionAccessLevel } from "../../types";

// Write a row to audit_logs with the correct column names
async function writeAuditLog(action: string, entity: string, userName: string, userRole: string, details: string) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    entity,
    user_name: userName,
    user_role: userRole,
    details,
    timestamp: new Date().toISOString(),
  });
  if (error) console.warn("[AUDIT] Insert failed:", error.message);
}

interface CirDetailView {
  id: string;
  status: string;
  initiatorName: string;
  createdAt: string;
  updatedAt: string;
  formData: Record<string, any>;
}

interface LocalAuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
}

export default function CirDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();

  const [formConfig, setFormConfig] = useState<FormSectionConfig[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [userOverrides, setUserOverrides] = useState<Record<string, SectionAccessLevel>>({});
  const [cir, setCir] = useState<CirDetailView | null>(null);
  const [isLoadingCir, setIsLoadingCir] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [auditLogs, setAuditLogs] = useState<LocalAuditLog[]>([]);

  // Comment state for checker / approver
  const [comment, setComment] = useState("");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ A: true });
  const toggleSection = (sId: string) => setOpenSections(prev => ({ ...prev, [sId]: !prev[sId] }));

  // Fetch form config
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from("form_config").select("sections").eq("id", "default").single();
        setFormConfig(!error && data?.sections ? (data.sections as FormSectionConfig[]) : FALLBACK_FORM_CONFIG);
      } catch {
        setFormConfig(FALLBACK_FORM_CONFIG);
      } finally {
        setIsLoadingConfig(false);
      }
    })();
  }, []);

  // Fetch CIR record
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase.from("cir_records").select("*").eq("cir_number", id).single();
        if (error) throw error;
        setCir({
          id: data.cir_number,
          status: data.status,
          initiatorName: data.initiator_name || "Unknown",
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          formData: data.form_data || {},
        });
      } catch {
        setCir({ id, status: "UNKNOWN", initiatorName: "N/A", createdAt: "", updatedAt: "", formData: {} });
      } finally {
        setIsLoadingCir(false);
      }
    })();
  }, [id]);

  // Fetch audit logs for this CIR
  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .ilike("entity", `%${id}%`)
        .order("timestamp", { ascending: false })
        .limit(50);
      setAuditLogs(data || []);
    })();
  }, [id]);

  // Fetch section overrides
  useEffect(() => {
    if (!user || user.role === "SUPER_ADMIN") return;
    (async () => {
      const { data, error } = await supabase.from("section_access_overrides").select("overrides").eq("user_id", user.uid).single();
      if (!error && data) setUserOverrides((data.overrides as Record<string, SectionAccessLevel>) || {});
    })();
  }, [user]);

  const visibleSections = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") return formConfig.filter(s => s.isVisible);
    return formConfig.filter(s => {
      if (!s.isVisible) return false;
      if (userOverrides[s.sectionId] === "no_access") return false;
      return true;
    });
  }, [formConfig, userOverrides, user]);

  if (isLoadingCir || isLoadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span className="text-gray-500 font-medium">Loading CIS record...</span>
      </div>
    );
  }
  if (!cir) return <div className="text-center py-20 text-gray-500">CIS record not found.</div>;

  // ===================== STATUS UPDATE =====================
  const updateCirStatus = async (newStatus: string, actionLabel: string) => {
    setIsUpdatingStatus(true);
    try {
      const detailText = comment.trim()
        ? `Status changed from ${cir.status} to ${newStatus}. Comment: ${comment.trim()}`
        : `Status changed from ${cir.status} to ${newStatus}.`;

      // Update the CIR
      const updatePayload: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };

      // Persist comment into form_data under checker_comment or approver_comment
      if (comment.trim()) {
        const role = user?.role || "";
        const commentField = role === "APPROVER" ? "approver_comment" : "checker_comment";
        updatePayload.form_data = {
          ...cir.formData,
          [commentField]: comment.trim(),
          [`${commentField}_by`]: user?.name,
          [`${commentField}_at`]: new Date().toISOString(),
        };
      }

      const { error } = await supabase.from("cir_records").update(updatePayload).eq("cir_number", cir.id);
      if (error) throw error;

      // Write audit log with CORRECT column names
      await writeAuditLog(
        "STATUS_CHANGE",
        cir.id,
        user?.name || "Unknown",
        user?.role || "UNKNOWN",
        detailText
      );

      // Refresh audit logs in UI
      const { data: updatedLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .ilike("entity", `%${cir.id}%`)
        .order("timestamp", { ascending: false })
        .limit(50);
      setAuditLogs(updatedLogs || []);

      setCir({ ...cir, status: newStatus, formData: updatePayload.form_data || cir.formData });
      setComment("");
      alert(`✅ ${actionLabel} successfully!`);
    } catch (e: any) {
      alert(`❌ Failed: ${e?.message || "Unknown error"}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ===================== CSV EXPORT =====================
  const handleDownloadCSV = () => {
    const rows: string[][] = [];
    rows.push(["CIS Number", cir.id.replace('CIR', 'CIS')]);
    rows.push(["Status", cir.status]);
    rows.push(["Date Created", cir.createdAt ? new Date(cir.createdAt).toLocaleDateString() : "N/A"]);
    rows.push(["Initiator", cir.initiatorName]);
    rows.push([]);

    visibleSections.forEach(section => {
      rows.push([`--- Section ${section.sectionId}: ${section.sectionLabel} ---`]);
      section.fields.forEach(field => {
        if (!field.isActive) return;
        let val = cir.formData?.[field.fieldId];
        if (typeof val === "boolean") val = val ? "Yes" : "No";
        if (Array.isArray(val)) val = val.join("; ");
        rows.push([field.fieldLabel, val !== undefined && val !== null ? String(val) : ""]);
      });
      rows.push([]);
    });

    // Add checker/approver comments if present
    if (cir.formData?.checker_comment || cir.formData?.approver_comment) {
      rows.push(["--- Review Comments ---"]);
      if (cir.formData.checker_comment) {
        rows.push(["Checker Comment", cir.formData.checker_comment]);
        rows.push(["Checked by", cir.formData.checker_comment_by || ""]);
      }
      if (cir.formData.approver_comment) {
        rows.push(["Approver Comment", cir.formData.approver_comment]);
        rows.push(["Approved by", cir.formData.approver_comment_by || ""]);
      }
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cir.id.replace('CIR', 'CIS')}_CIS_Export.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===================== PDF EXPORT =====================
  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const checkPageBreak = (needed: number) => {
      if (y + needed > 270) { pdf.addPage(); y = 20; }
    };

    // Title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Customer Input Requirements (CIS)", margin, y);
    y += 8;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(120);
    pdf.text("EMMFORCE Autotech — Accelerating the Performance", margin, y);
    pdf.setTextColor(0);
    y += 10;

    // Meta box
    pdf.setDrawColor(200);
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, contentWidth, 24, "FD");
    pdf.setFontSize(9);
    pdf.text(`CIS Number: ${cir.id.replace('CIR', 'CIS')}`, margin + 4, y + 6);
    pdf.text(`Status: ${cir.status}`, margin + 4, y + 12);
    pdf.text(`Initiator: ${cir.initiatorName}`, margin + contentWidth / 2, y + 6);
    pdf.text(`Date: ${cir.createdAt ? new Date(cir.createdAt).toLocaleDateString() : "N/A"}`, margin + contentWidth / 2, y + 12);
    y += 30;

    // Sections
    visibleSections.forEach(section => {
      checkPageBreak(20);
      pdf.setFillColor(27, 42, 74);
      pdf.rect(margin, y, contentWidth, 8, "F");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255);
      pdf.text(`Section ${section.sectionId}: ${section.sectionLabel}`, margin + 4, y + 5.5);
      pdf.setTextColor(0);
      y += 12;

      section.fields.forEach(field => {
        if (!field.isActive) return;
        checkPageBreak(12);
        let val = cir.formData?.[field.fieldId];
        if (typeof val === "boolean") val = val ? "Yes" : "No";
        if (Array.isArray(val)) val = val.join("; ");
        const displayVal = val !== undefined && val !== null ? String(val) : "—";
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(100);
        pdf.text(field.fieldLabel, margin + 2, y);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0);
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(displayVal, contentWidth - 70);
        pdf.text(lines, margin + 65, y);
        y += Math.max(6, lines.length * 4.5) + 2;
      });
      y += 4;
    });

    // Comments section in PDF
    if (cir.formData?.checker_comment || cir.formData?.approver_comment) {
      checkPageBreak(20);
      pdf.setFillColor(255, 237, 213);
      pdf.rect(margin, y, contentWidth, 8, "F");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0);
      pdf.text("Review Comments", margin + 4, y + 5.5);
      y += 12;

      if (cir.formData.checker_comment) {
        checkPageBreak(12);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text("Checker Comment:", margin + 2, y);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(cir.formData.checker_comment, contentWidth - 10);
        pdf.text(lines, margin + 2, y + 5);
        y += 5 + lines.length * 4.5 + 4;
      }
      if (cir.formData.approver_comment) {
        checkPageBreak(12);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.text("Approver Comment:", margin + 2, y);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(cir.formData.approver_comment, contentWidth - 10);
        pdf.text(lines, margin + 2, y + 5);
        y += 5 + lines.length * 4.5 + 4;
      }
    }

    pdf.save(`${cir.id.replace('CIR', 'CIS')}_CIS_Report.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "SUBMITTED": return "bg-blue-100 text-blue-700";
      case "CHECKED": return "bg-indigo-100 text-indigo-700";
      case "APPROVED": return "bg-green-100 text-green-700";
      case "REJECTED": return "bg-red-100 text-red-700";
      case "RETURNED": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const canCheck = (user?.role === "CHECKER" || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && cir.status === "SUBMITTED";
  const canApprove = (user?.role === "APPROVER" || user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && cir.status === "CHECKED";

  return (
    <div id="cir-pdf-content" className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="bg-white shadow sm:rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{(cir.formData?.cirNumber || cir.id).replace('CIR', 'CIS')}</h1>
            <p className="text-sm text-gray-500 mt-1">{cir.formData?.partDescription} • {cir.formData?.customerName}</p>
          </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${getStatusBadge(cir.status)}`}>
            {cir.status}
          </span>
          {(cir.status === 'DRAFT' || cir.status === 'RETURNED') && (
            <Link to={`/cir/${cir.id}/edit`} className="inline-flex items-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500">
              <Pencil className="mr-2 h-4 w-4" /> Edit Record
            </Link>
          )}
          <button onClick={handleDownloadCSV} className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" /> Excel
          </button>
          <button onClick={handleDownloadPDF} className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <Download className="mr-2 h-4 w-4 text-red-600" /> PDF
          </button>
        </div>
      </div>

      {/* Checker Panel */}
      {canCheck && (
        <div className="bg-amber-50 border border-amber-200 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Checker Review
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-amber-800 mb-1">
              Checker Comment <span className="text-amber-500 text-xs">(optional — saved with this action)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Add your review comment, observations, or conditions for approval..."
              className="block w-full rounded-md border border-amber-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateCirStatus("CHECKED", "CIS moved to Approver")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
            >
              {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Move to Approver
            </button>
            <button
              onClick={() => updateCirStatus("RETURNED", "CIS returned to Initiator")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
            >
              <CornerUpLeft className="mr-2 h-4 w-4" /> Return to Initiator
            </button>
          </div>
        </div>
      )}

      {/* Approver Panel */}
      {canApprove && (
        <div className="bg-blue-50 border border-blue-200 shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Final Approval
          </h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-800 mb-1">
              Approver Comment <span className="text-blue-500 text-xs">(optional — saved with this action)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Add your approval notes, conditions, or rejection reason..."
              className="block w-full rounded-md border border-blue-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateCirStatus("APPROVED", "CIS Approved")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
            >
              {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Approve CIS
            </button>
            <button
              onClick={() => updateCirStatus("REJECTED", "CIS Rejected")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
            >
              <XCircle className="mr-2 h-4 w-4" /> Reject
            </button>
            <button
              onClick={() => updateCirStatus("RETURNED", "CIS returned to Maker")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
            >
              <CornerUpLeft className="mr-2 h-4 w-4" /> Return to Maker
            </button>
          </div>
        </div>
      )}

      {/* Existing comments display (always visible) */}
      {(cir.formData?.checker_comment || cir.formData?.approver_comment) && (
        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-400" /> Review Comments
          </h3>
          {cir.formData.checker_comment && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                Checker — {cir.formData.checker_comment_by || "Reviewer"}{cir.formData.checker_comment_at ? ` · ${new Date(cir.formData.checker_comment_at).toLocaleString()}` : ""}
              </p>
              <p className="text-sm text-gray-800">{cir.formData.checker_comment}</p>
            </div>
          )}
          {cir.formData.approver_comment && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Approver — {cir.formData.approver_comment_by || "Approver"}{cir.formData.approver_comment_at ? ` · ${new Date(cir.formData.approver_comment_at).toLocaleString()}` : ""}
              </p>
              <p className="text-sm text-gray-800">{cir.formData.approver_comment}</p>
            </div>
          )}
        </div>
      )}

      {/* Form Sections Accordion */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden divide-y divide-gray-200">
        {visibleSections.map(section => (
          <div key={section.sectionId}>
            <button
              onClick={() => toggleSection(section.sectionId)}
              className="w-full px-6 py-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <h3 className="text-sm font-medium text-gray-900 flex items-center">
                <FileText className="mr-3 h-5 w-5 text-gray-400" />
                Section {section.sectionId}: {section.sectionLabel}
              </h3>
              {openSections[section.sectionId] ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
            </button>
            {openSections[section.sectionId] && (
              <div className="px-6 py-5">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                  {section.fields.map(field => {
                    if (field.isRestricted && user?.role === "ENGINEERING") return null;
                    if (!field.isActive) return null;
                    if (field.fieldType === "file") return null;
                    return (
                      <div key={field.fieldId}>
                        <dt className="text-gray-500 font-medium">{field.fieldLabel}</dt>
                        <dd className="mt-1 text-gray-900 font-semibold">
                          {field.fieldType === "toggle" || field.fieldType === "checkbox"
                            ? (cir.formData[field.fieldId] ? "Yes" : "No")
                            : cir.formData[field.fieldId] || "—"}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {section.sectionId === "A" && cir.formData.partImage && (
                  <div className="mt-4 w-full md:w-64">
                    <dt className="text-gray-500 font-medium text-sm mb-2">Project Image Reference</dt>
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <img src={cir.formData.partImage} alt="Part Reference" className="h-full w-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Audit Trail — Real data from audit_logs */}
      <div className="bg-white shadow sm:rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center border-b pb-2">
          <Clock className="mr-2 h-5 w-5 text-gray-400" /> Revisions & History
        </h3>
        {auditLogs.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">
            No activity recorded yet. Actions (Check, Approve, Reject) will appear here.
          </div>
        ) : (
          <ul role="list" className="space-y-4">
            {auditLogs.map((log, i) => (
              <li key={log.id} className="relative flex gap-4">
                {i < auditLogs.length - 1 && (
                  <span className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}
                <div className="flex-shrink-0">
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white text-xs font-bold
                    ${log.action === "STATUS_CHANGE" ? "bg-blue-100 text-blue-700" :
                      log.action === "CREATE" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-500"}`}>
                    {(log.user_name || "?")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{log.user_name}</span>
                      <span className="text-xs text-gray-400 ml-1">({log.user_role})</span>
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                        {log.action}
                      </span>
                    </p>
                    <time className="whitespace-nowrap text-xs text-gray-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                    </time>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{log.details}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
