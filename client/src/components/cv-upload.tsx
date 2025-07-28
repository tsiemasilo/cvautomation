import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CVUploadProps {
  userId: string;
}

export default function CVUpload({ userId }: CVUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user CVs
  const { data: cvsData, isLoading } = useQuery({
    queryKey: ["/api/users", userId, "cvs"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('userId', userId);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      try {
        const response = await fetch('/api/cvs/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "CV uploaded successfully",
        description: "Your CV has been parsed and is ready for job applications",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "cvs"] });
      setUploadProgress(0);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large", 
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const currentCv = (cvsData as any)?.cvs?.[0]; // Most recent CV

  return (
    <Card data-testid="card-cv-upload">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CV Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-300 hover:border-primary hover:bg-slate-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          data-testid="area-file-upload"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-900 font-semibold mb-2">Upload your CV</p>
          <p className="text-slate-600 text-sm mb-4">
            Drag and drop your CV here or click to browse
          </p>
          <Button 
            variant="outline" 
            size="sm"
            disabled={uploadMutation.isPending}
            data-testid="button-choose-file"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Choose File
          </Button>
          <p className="text-slate-500 text-xs mt-2">
            Supports PDF, DOC, DOCX up to 10MB
          </p>
        </div>

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <div className="space-y-2" data-testid="progress-upload">
            <div className="flex justify-between text-sm">
              <span>Uploading and parsing CV...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Current CV Display */}
        {currentCv && (
          <div className="p-4 bg-slate-50 rounded-lg" data-testid="display-current-cv">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm" data-testid="text-cv-filename">
                    {currentCv.originalName}
                  </p>
                  <p className="text-slate-600 text-xs" data-testid="text-cv-upload-date">
                    Uploaded {new Date(currentCv.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" data-testid="badge-cv-status">
                  Parsed
                </Badge>
                <Button variant="ghost" size="sm" data-testid="button-download-cv">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Parsed Data Preview */}
            {currentCv.parsedData && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Extracted Information:</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {currentCv.parsedData.name && (
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <span className="ml-1 text-slate-700" data-testid="text-parsed-name">
                        {currentCv.parsedData.name}
                      </span>
                    </div>
                  )}
                  {currentCv.parsedData.email && (
                    <div>
                      <span className="text-slate-500">Email:</span>
                      <span className="ml-1 text-slate-700" data-testid="text-parsed-email">
                        {currentCv.parsedData.email}
                      </span>
                    </div>
                  )}
                  {currentCv.parsedData.skills && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Skills:</span>
                      <span className="ml-1 text-slate-700" data-testid="text-parsed-skills">
                        {currentCv.parsedData.skills.slice(0, 5).join(', ')}
                        {currentCv.parsedData.skills.length > 5 && '...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          data-testid="input-file-hidden"
        />
      </CardContent>
    </Card>
  );
}
