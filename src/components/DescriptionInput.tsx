import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescriptionInput({ value, onChange }: DescriptionInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        placeholder="Enter your description here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    </div>
  );
}
