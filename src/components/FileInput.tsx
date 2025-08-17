import { Input } from "@/components/ui/input"

export function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-3">
      <Input id="picture" type="file" />
    </div>
  )
}
