import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ImageFieldProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const ImageInput: React.FC<ImageFieldProps> = ({ label, file, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {file && (
        <Card className="mt-3 flex items-center p-3 flex-row">
          <img
            src={URL.createObjectURL(file)}
            alt={file.name}
            className="h-20 w-20 object-cover rounded-md border"
          />
          <div>
            <CardHeader className="p-0">
              <CardTitle className="text-sm">{file.name}</CardTitle>
              <CardDescription className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </CardDescription>
            </CardHeader>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageInput;
