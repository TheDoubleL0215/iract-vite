import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { toast } from "sonner";

const layoutOptions = ["Basic", "Versus"] as const;
type LayoutTypes = (typeof layoutOptions)[number];

function App() {
  const [selectedLayout, setSelectedLayout] = useState<LayoutTypes>("Basic");

  // Common fields
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  // Basic layout
  const [coverImage, setCoverImage] = useState<File | null>(null);

  // Versus layout
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleFileChange = (
    file: File | null,
    setter: (value: File | null) => void
  ) => setter(file);

  const handleSubmit = async () => {
    // validation: at least one image or description
    const hasInput =
      description.trim() ||
      logoImage ||
      (selectedLayout === "Basic" && coverImage) ||
      (selectedLayout === "Versus" && (beforeImage || afterImage));

    if (!hasInput) {
      alert("Please provide at least a description or an image.");
      return;
    }

    setIsSubmitting(true);
    setResultImage(null);

    try {
      const formData = new FormData();
      if (description.trim()) formData.append("Description", description);
      if (logoImage) formData.append("Logo", logoImage);

      let url = "";

      if (selectedLayout === "Basic") {
        url =
          "https://n8n.prometheusagency.hu/webhook/create-iract/basic";
        if (coverImage) formData.append("Image", coverImage);
      } else {
        url =
          "https://n8n.prometheusagency.hu/webhook/create-iract/versus";
        if (beforeImage) formData.append("Before", beforeImage);
        if (afterImage) formData.append("After", afterImage);
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.productUrl) {
        setResultImage(result.productUrl);
        toast.success("Yaay, the image is ready 🎉");
      } else {
        toast.warning("Successfully created, but no image URL was returned.");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Network or server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!resultImage) return;

    try {
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "generated-product.png";
      document.body.appendChild(a);
      a.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              IRACT Post Creator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Layout Selector */}
            <div className="space-y-2">
              <Label htmlFor="layout">Layout</Label>
              <Select
                value={selectedLayout}
                onValueChange={(value: LayoutTypes) => setSelectedLayout(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Choose layout" />
                </SelectTrigger>
                <SelectContent>
                  {layoutOptions.map((layout) => (
                    <SelectItem key={layout} value={layout}>
                      {layout}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields */}
            {selectedLayout === "Basic" && (
              <div className="space-y-2">
                <Label htmlFor="cover-image">Cover Image</Label>
                <Input
                  id="cover-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange(e.target.files?.[0] || null, setCoverImage)
                  }
                  className="cursor-pointer"
                />
                {coverImage && (
                  <p className="text-sm text-green-600">
                    ✓ Cover image uploaded ({coverImage.name})
                  </p>
                )}
              </div>
            )}

            {selectedLayout === "Versus" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="before-image">Before Image</Label>
                  <Input
                    id="before-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        e.target.files?.[0] || null,
                        setBeforeImage
                      )
                    }
                    className="cursor-pointer"
                  />
                  {beforeImage && (
                    <p className="text-sm text-green-600">
                      ✓ Before image uploaded ({beforeImage.name})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="after-image">After Image</Label>
                  <Input
                    id="after-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        e.target.files?.[0] || null,
                        setAfterImage
                      )
                    }
                    className="cursor-pointer"
                  />
                  {afterImage && (
                    <p className="text-sm text-green-600">
                      ✓ After image uploaded ({afterImage.name})
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label htmlFor="logo-image">Logo</Label>
              <Input
                id="logo-image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e.target.files?.[0] || null, setLogoImage)
                }
                className="cursor-pointer"
              />
              {logoImage && (
                <p className="text-sm text-green-600">
                  ✓ Logo uploaded ({logoImage.name})
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter your description here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={
                isSubmitting ||
                (!description.trim() &&
                  !logoImage &&
                  (selectedLayout === "Basic"
                    ? !coverImage
                    : !beforeImage && !afterImage))
              }
            >
              {isSubmitting ? "Generating..." : "Submit"}
            </Button>

            {/* Result Section */}
            {resultImage && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Generated Result:</h3>
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={resultImage}
                    alt="Generated product"
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
                <Button
                  onClick={handleDownload}
                  className="w-full"
                  variant="outline"
                >
                  Download Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
