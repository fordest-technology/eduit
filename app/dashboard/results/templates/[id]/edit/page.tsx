"use client";

import { EditorProvider } from "@/components/results/template-editor/editor-context";
import EditTemplatePageContent from "./page-content";

export default function EditTemplatePage() {
    return (
        <EditorProvider>
            <EditTemplatePageContent />
        </EditorProvider>
    )
}
