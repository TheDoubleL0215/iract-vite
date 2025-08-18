import React from "react";
import { Input } from "@/components/ui/input";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const VariableTextInput: React.FC<TextFieldProps> = ({ label, value, onChange }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={`Enter ${label}...`}
      />
    </div>
  );
};

export default VariableTextInput;
