import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, CloudUpload } from "lucide-react";

interface FileUploadSectionProps {
  fileNames: string[];
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loadDemoData: () => void;
  startDate: string;
  endDate: string;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
}

const FileUploadSection = ({
  fileNames,
  handleFileUpload,
  loadDemoData,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: FileUploadSectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader className="px-6 py-5 border-b border-gray-200">
        <CardTitle className="text-lg font-medium text-gray-800">Import Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-4">
          <div className="w-full md:w-auto flex-grow">
            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <CloudUpload className="w-8 h-8 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                multiple
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
            <div className="mt-3 text-sm text-gray-500">
              {fileNames.length > 0 ? (
                <ul className="list-disc pl-4">
                  {fileNames.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ul>
              ) : (
                <span id="file-name">No files selected</span>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col justify-center">
            <span className="block text-sm font-medium text-gray-700 mb-2">Or</span>
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={loadDemoData}
            >
              Load Demo Data
            </Button>
          </div>

          <div className="w-full md:w-auto flex items-end">
            <div>
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <Label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    id="start-date"
                    name="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </Label>
                  <Input
                    type="date"
                    id="end-date"
                    name="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploadSection;
