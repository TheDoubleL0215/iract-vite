import React, { useState, useEffect } from 'react';
import SavedUrlsDialog from './components/SavedUrlsDialog';
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/utils/supabase'
import { Button } from './components/ui/button';
import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import { Loader2 } from "lucide-react";
import type { Dataset } from './const/Dataset';
import type { FormDataValue } from './const/FormDataValue';
import type { SubmissionData } from './const/SubmissionData';
import type { CanvaTemplate } from './const/CanvaTemplate';
import VariableTextInput from './components/VariableTextInput';
import ImageInput from './components/ImageInput';


function App() {
  //apik
  const WEBHOOK_DATASET_QUERY: string = import.meta.env.VITE_IRACT_DATASET_QUERY_API_ENDPOINT as string;
  const WEBHOOK_V2: string = import.meta.env.VITE_IRACT_CREATE_V2_API_ENDPOINT as string;


  const [brandUrl, setBrandUrl] = useState<string>('');
  const [savedTemplates, setSavedTemplates] = useState<CanvaTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [datasetStructure, setDatasetStructure] = useState<Dataset | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormDataValue>({});
  const [submittedData, setSubmittedData] = useState<SubmissionData | null>(null);

  useEffect(() => {
    fetchSavedTemplates();
  }, []);

  const fetchSavedTemplates = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('iract_canvaTemplates')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching templates:", error);
        return;
      }

      if (data) {
        setSavedTemplates(data);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleTemplateSelect = (templateId: string): void => {
    setSelectedTemplateId(templateId);
    const selectedTemplate = savedTemplates.find(template => template.id.toString() === templateId);

    if (selectedTemplate) {
      setBrandUrl(selectedTemplate.url);
      fetchDatasetStructure(selectedTemplate.url);
    }

    setDatasetStructure(null);
    setFormData({});
    setSubmittedData(null);
    setError('');
  };


  const handleDownload = async () => {

    //Ezt a részt Claude írta, nem minding működik
    if (!submittedData?.productUrl) return;

    try {
      const response = await fetch(submittedData.productUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "product.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download file:", error);
    }
  };

  const fetchDatasetStructure = async (urlFromTemplate?: string): Promise<void> => {
    const urlToUse = urlFromTemplate || brandUrl;
    if (!urlToUse.trim()) {
      setError('Please select a template first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = new URL(WEBHOOK_DATASET_QUERY);
      url.searchParams.append('brandUrl', urlToUse);

      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { dataset: Dataset } = await response.json();

      if (data.dataset) {
        setDatasetStructure(data.dataset);

        // Ez itt sok időbe tellett :(
        const initialFormData: FormDataValue = {};
        Object.keys(data.dataset).forEach((fieldName: string) => {
          if (data.dataset[fieldName].type === 'text') {
            initialFormData[fieldName] = '';
          } else if (data.dataset[fieldName].type === 'image') {
            initialFormData[fieldName] = null;
          }
        });
        setFormData(initialFormData);
      } else {
        throw new Error('Invalid response format - missing dataset property');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to fetch dataset: ${errorMessage}`);
      setDatasetStructure(null);
    } finally {
      setLoading(false);
    }
  };

  //nem tudom hogy ezek hogyan működnek de teszik a dolguk
  const handleInputChange = (fieldName: string, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFileChange = (fieldName: string, file: File | null): void => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!datasetStructure) return;

    setLoadingImage(true);

    const formDataToSend = new FormData();
    formDataToSend.append("brandUrl", brandUrl);

    for (const [fieldName, value] of Object.entries(formData)) {
      const fieldType = datasetStructure[fieldName]?.type;

      if (fieldType === "text") {
        formDataToSend.append(fieldName, (value as string) || "");
      } else if (fieldType === "image" && value instanceof File) {
        formDataToSend.append(fieldName, value);
      } else if (fieldType === "image" && !value) {
        formDataToSend.append(fieldName, "data");
      }
    }

    try {
      const response = await fetch(
        WEBHOOK_V2,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const result = await response.json();
      console.log("Success:", result);
      setSubmittedData(result);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoadingImage(false);
    }
  };


  // EZ a legértékesebb kód részlet a projektben!
  const renderFormFields = (): React.ReactNode[] => {
    if (!datasetStructure) return [];

    return Object.entries(datasetStructure).map(([fieldName, fieldConfig]) => {
      if (fieldConfig.type === "text") {
        return (
          <VariableTextInput
            key={fieldName}
            label={fieldName}
            value={(formData[fieldName] as string) || ""}
            onChange={(value) => handleInputChange(fieldName, value)}
          />
        );
      } else if (fieldConfig.type === "image") {
        return (
          <ImageInput
            key={fieldName}
            label={fieldName}
            file={formData[fieldName] as File | null}
            onChange={(file) => handleFileChange(fieldName, file)}
          />
        );
      }
      return null;
    });
  };

  const resetForm = (): void => {
    if (datasetStructure) {
      const resetFormData: FormDataValue = {};
      Object.keys(datasetStructure).forEach((fieldName: string) => {
        if (datasetStructure[fieldName].type === 'text') {
          resetFormData[fieldName] = '';
        } else if (datasetStructure[fieldName].type === 'image') {
          resetFormData[fieldName] = null;
        }
      });
      setFormData(resetFormData);
    }
    setSubmittedData(null);
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* HEADER */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <img
          src="/bat.svg"
          alt="Logo"
          className="h-10 w-10 object-contain"
        />
        <h1 className="text-3xl font-bold text-gray-800">
          IRACT Post Creator
        </h1>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDE (Selector + Components + Submit) */}
        <div className="flex flex-col lg:max-w-md w-full border rounded-lg">
          {/* Fixed Template Selector */}
          <div className="bg-gray-50 p-6 border-b">
            <div className="mb-3 w-full">
              <SavedUrlsDialog />
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              Select Canva Template
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose from saved templates
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleTemplateSelect}
                  disabled={savedTemplates.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        savedTemplates.length === 0
                          ? "No templates saved yet"
                          : "Select a template..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {savedTemplates.map((template) => (
                      <SelectItem
                        key={template.id}
                        value={template.id.toString()}
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant={"outline"} onClick={fetchSavedTemplates}>
                  <RefreshCw />
                </Button>
              </div>

              <div className="flex gap-4">
                {(datasetStructure || error || selectedTemplateId) && (
                  <Button variant={"outline"} onClick={resetForm}>
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Scrollable Components */}
          <div className="flex-1 overflow-y-auto p-6">
            {datasetStructure && (
              <div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">
                  Components
                </h2>
                <div className="space-y-4">{renderFormFields()}</div>
              </div>
            )}
          </div>

          {/* Submit Button always visible at bottom */}
          {datasetStructure && (
            <div className="bg-gray-50 border-t p-6">
              <Button
                onClick={handleSubmit}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-md transition-colors duration-200 flex items-center justify-center"
                disabled={loadingImage}
              >
                {loadingImage ?? loading ? (
                  <>
                    Submitting
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  </>
                ) : (
                  "Create Image"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT SIDE (Sticky Results) */}
        <div className="flex-1">
          <div className="sticky top-6">
            {loadingImage && (
              <div className="bg-gray-50 p-6 rounded-lg text-center border sticky top-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4">
                  Generated Product
                </h2>
                <Card className="max-w-md mx-auto rounded-md border mb-6">
                  <CardContent className="flex justify-center items-center py-44 flex-col gap-3">
                    <LoaderCircle className=" text-gray-700 h-10 w-10 animate-spin" />
                    <h3 className="text-xl font-semibold text-gray-700">
                      Your image is underway! 📦
                    </h3>
                    <h3 className="text-sm font-semibold text-gray-700">
                      Here you will see the generated result!
                    </h3>
                    <h3 className="text-sm font-semibold text-gray-700">
                      {"(Generating usually takes around 15-20 seconds)"}
                    </h3>
                  </CardContent>
                </Card>
              </div>
            )}

            {submittedData?.productUrl && (
              <div className="bg-gray-50 p-6 rounded-lg text-center border">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Generated Product
                </h2>
                <img
                  src={submittedData.productUrl}
                  alt="Generated Product"
                  className="max-w-md mx-auto rounded-md border shadow mb-6"
                />
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={handleDownload}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 rounded-md transition-colors duration-200 flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );


};

export default App;
