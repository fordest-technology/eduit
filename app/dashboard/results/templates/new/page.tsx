"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2, GraduationCap, BookOpen, FileText, Sparkles, Calendar, History } from "lucide-react";
import { 
  primarySchoolTemplate, 
  secondarySchoolTemplate,
  firstTermTemplate,
  midYearTemplate,
  annualTemplate,
  templateToEditorState 
} from "@/lib/result-templates";

type TemplatePreset = "blank" | "primary" | "secondary" | "periodic" | "mid-year" | "annual";

const presets: { id: TemplatePreset; name: string; description: string; icon: React.ElementType; color: string }[] = [
  {
    id: "periodic",
    name: "First Term Only",
    description: "Standard report for a single term assessment",
    icon: Calendar,
    color: "bg-emerald-600"
  },
  {
    id: "mid-year",
    name: "Cumulative (1st & 2nd)",
    description: "Compares 1st and 2nd term performance side-by-side",
    icon: History,
    color: "bg-blue-600"
  },
  {
    id: "annual",
    name: "Full Academic Year",
    description: "Comprehensive 1st, 2nd, and 3rd term results",
    icon: GraduationCap,
    color: "bg-purple-600"
  },
  {
    id: "primary",
    name: "Primary/Nursery",
    description: "Simple colorful layout for younger students",
    icon: BookOpen,
    color: "bg-pink-500"
  },
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start from scratch with an empty template",
    icon: FileText,
    color: "bg-slate-500"
  },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<TemplatePreset>("periodic");

  const getInitialContent = () => {
    switch (selectedPreset) {
      case "periodic":
        return templateToEditorState(firstTermTemplate);
      case "mid-year":
        return templateToEditorState(midYearTemplate);
      case "annual":
        return templateToEditorState(annualTemplate);
      case "primary":
        return templateToEditorState(primarySchoolTemplate);
      case "secondary":
        return templateToEditorState(secondarySchoolTemplate);
      case "blank":
      default:
        return { elements: [], canvasSize: { width: 794, height: 1123 } };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    setLoading(true);

    try {
      const session = await getSession();
      if (!session?.schoolId) {
        toast.error("School not found");
        return;
      }

      const content = getInitialContent();

      const res = await fetch(`/api/schools/${session.schoolId}/results/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          content,
          isDefault: false
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create template");
      }

      const data = await res.json();
      toast.success("Template created successfully!");
      router.push(`/dashboard/results/templates/${data.id}/edit`);
    } catch (error) {
      console.error("Template creation error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Sparkles className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Create Result Template</h1>
        <p className="text-slate-500 mt-2">
          Design a professional result sheet for your school
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg">Template Details</CardTitle>
            <CardDescription>Give your template a name and choose a starting point</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. First Term Report Card 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Description <span className="text-slate-400">(optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Brief description of what this template is for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Template Preset Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Choose Starting Template</Label>
              <RadioGroup
                value={selectedPreset}
                onValueChange={(val) => setSelectedPreset(val as TemplatePreset)}
                className="grid gap-3"
              >
                {presets.map((preset) => (
                  <Label
                    key={preset.id}
                    htmlFor={preset.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedPreset === preset.id
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <RadioGroupItem value={preset.id} id={preset.id} className="mt-1" />
                    <div className={`p-2.5 rounded-lg ${preset.color} shrink-0`}>
                      <preset.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{preset.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{preset.description}</div>
                    </div>
                    {preset.id !== "blank" && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Info Box */}
            {selectedPreset !== "blank" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">✨ Pre-designed template</p>
                <p>
                  This template includes a professional layout with header, student info, 
                  subjects table, affective/psychomotor domains, grading scale, and signature sections.
                  You can customize everything in the editor.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between gap-4 bg-slate-50 border-t">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => router.back()}
              className="text-slate-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim()} 
              className="bg-orange-600 hover:bg-orange-700 px-8"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create & Open Editor
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

