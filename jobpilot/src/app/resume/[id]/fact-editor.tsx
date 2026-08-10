"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RESUME_FACT_TYPES, type ResumeFactType } from "@/lib/enums";
import {
  FACT_FIELD_CONFIG,
  FACT_TYPE_IS_SINGLETON,
  FACT_TYPE_LABELS,
  blankFactContent,
} from "@/lib/resume/fact-field-config";
import {
  replaceResumeFactsAction,
  setResumeFactLockedAction,
} from "@/server/actions/resume-facts";
import type { ResumeFactInput } from "@/lib/resume/fact-schemas";

interface ServerFact {
  id: string;
  type: string;
  content: unknown;
  verified: boolean;
  locked: boolean;
  sortOrder: number;
}

interface DraftFact {
  clientId: string;
  id?: string;
  type: ResumeFactType;
  content: Record<string, unknown>;
  verified: boolean;
  locked: boolean;
  sortOrder: number;
}

let clientIdCounter = 0;
function nextClientId() {
  clientIdCounter += 1;
  return `draft-${clientIdCounter}`;
}

function toDraft(fact: ServerFact): DraftFact {
  return {
    clientId: fact.id,
    id: fact.id,
    type: fact.type as ResumeFactType,
    content: (fact.content ?? {}) as Record<string, unknown>,
    verified: fact.verified,
    locked: fact.locked,
    sortOrder: fact.sortOrder,
  };
}

export function FactEditor({
  masterResumeId,
  initialFacts,
}: {
  masterResumeId: string;
  initialFacts: ServerFact[];
}) {
  const router = useRouter();
  const [facts, setFacts] = useState<DraftFact[]>(() => initialFacts.map(toDraft));
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function updateContent(clientId: string, key: string, value: unknown) {
    setFacts((prev) =>
      prev.map((f) =>
        f.clientId === clientId ? { ...f, content: { ...f.content, [key]: value } } : f
      )
    );
  }

  function updateVerified(clientId: string, verified: boolean) {
    setFacts((prev) => prev.map((f) => (f.clientId === clientId ? { ...f, verified } : f)));
  }

  function addFact(type: ResumeFactType) {
    const sameType = facts.filter((f) => f.type === type);
    setFacts((prev) => [
      ...prev,
      {
        clientId: nextClientId(),
        type,
        content: blankFactContent(type),
        verified: false,
        locked: false,
        sortOrder: sameType.length,
      },
    ]);
  }

  function removeFact(clientId: string) {
    setFacts((prev) => prev.filter((f) => f.clientId !== clientId));
  }

  function toggleLocked(fact: DraftFact) {
    if (!fact.id) return; // can't lock a fact that hasn't been saved yet
    const nextLocked = !fact.locked;
    startSaving(async () => {
      const result = await setResumeFactLockedAction(fact.id!, nextLocked);
      if (result.ok) {
        setFacts((prev) =>
          prev.map((f) => (f.clientId === fact.clientId ? { ...f, locked: nextLocked } : f))
        );
      }
    });
  }

  function handleSave() {
    setSaveError(null);
    const payload: ResumeFactInput[] = facts.map((f) => ({
      id: f.id,
      type: f.type,
      content: f.content,
      verified: f.verified,
      sortOrder: f.sortOrder,
    }));

    startSaving(async () => {
      const result = await replaceResumeFactsAction(masterResumeId, payload);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      setFacts((result.facts ?? []).map(toDraft));
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Accordion defaultValue={[...RESUME_FACT_TYPES]}>
        {RESUME_FACT_TYPES.map((type) => {
          const factsOfType = facts.filter((f) => f.type === type);
          const isSingleton = FACT_TYPE_IS_SINGLETON[type];
          const canAdd = !isSingleton || factsOfType.length === 0;

          return (
            <AccordionItem key={type} value={type}>
              <AccordionTrigger>
                {FACT_TYPE_LABELS[type]}
                {factsOfType.length > 0 && (
                  <span className="text-muted-foreground">
                    ({factsOfType.length})
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3">
                  {factsOfType.map((fact) => (
                    <FactCard
                      key={fact.clientId}
                      fact={fact}
                      onChangeField={(key, value) =>
                        updateContent(fact.clientId, key, value)
                      }
                      onChangeVerified={(verified) =>
                        updateVerified(fact.clientId, verified)
                      }
                      onToggleLocked={() => toggleLocked(fact)}
                      onRemove={() => removeFact(fact.clientId)}
                    />
                  ))}
                  {canAdd && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={() => addFact(type)}
                    >
                      <Plus /> Add {FACT_TYPE_LABELS[type].toLowerCase()}
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
        {saveError && <span className="text-sm text-destructive">{saveError}</span>}
        {!saveError && savedAt && (
          <span className="text-sm text-muted-foreground">Saved.</span>
        )}
      </div>
    </div>
  );
}

function FactCard({
  fact,
  onChangeField,
  onChangeVerified,
  onToggleLocked,
  onRemove,
}: {
  fact: DraftFact;
  onChangeField: (key: string, value: unknown) => void;
  onChangeVerified: (verified: boolean) => void;
  onToggleLocked: () => void;
  onRemove: () => void;
}) {
  const fields = FACT_FIELD_CONFIG[fact.type];
  const disabled = fact.locked;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {fact.locked ? "Locked — AI and edits cannot change this" : "Draft"}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleLocked}
            disabled={!fact.id}
            title={fact.locked ? "Unlock" : "Lock (prevent AI/edits from changing this)"}
          >
            {fact.locked ? <Lock /> : <LockOpen />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            disabled={disabled}
            title="Remove"
          >
            <Trash2 />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label>{field.label}</Label>
            {field.kind === "textarea" && (
              <Textarea
                value={(fact.content[field.key] as string) ?? ""}
                onChange={(e) => onChangeField(field.key, e.target.value)}
                disabled={disabled}
                rows={3}
              />
            )}
            {field.kind === "bulletList" && (
              <Textarea
                value={((fact.content[field.key] as string[]) ?? []).join("\n")}
                onChange={(e) =>
                  onChangeField(
                    field.key,
                    e.target.value.split("\n").map((line) => line.trim()).filter(Boolean)
                  )
                }
                disabled={disabled}
                rows={3}
              />
            )}
            {field.kind === "boolean" && (
              <Switch
                checked={Boolean(fact.content[field.key])}
                onCheckedChange={(checked) => onChangeField(field.key, checked)}
                disabled={disabled}
              />
            )}
            {field.kind === "text" && (
              <Input
                value={(fact.content[field.key] as string) ?? ""}
                onChange={(e) => onChangeField(field.key, e.target.value)}
                disabled={disabled}
              />
            )}
          </div>
        ))}

        <div className="mt-1 flex items-center gap-2">
          <Switch
            checked={fact.verified}
            onCheckedChange={onChangeVerified}
            disabled={disabled}
            id={`verified-${fact.clientId}`}
          />
          <Label htmlFor={`verified-${fact.clientId}`}>
            I&apos;ve verified this is accurate
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
