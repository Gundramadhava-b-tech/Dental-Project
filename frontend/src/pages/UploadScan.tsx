import { useState, useCallback } from "react";
import { useListPatients, useCreateScan } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, File, X, BrainCircuit, Activity, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { Analysis } from "@workspace/api-client-react";
import { generateReport } from "@/lib/generateReport";

export default function UploadScan() {
  const { data: patients = [] } = useListPatients();
  const createScanMutation = useCreateScan();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null); // Clear previous result
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/dicom': ['.dcm', '.dicom'],
      'application/octet-stream': ['.dcm', '.dicom'],
    },
    maxFiles: 1 
  });

  const handleUpload = () => {
    if (!selectedPatient || !file) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      
      createScanMutation.mutate({ 
        data: {
          patientId: parseInt(selectedPatient),
          filename: file.name,
          fileData: base64
        }
      }, {
        onSuccess: (res) => {
          setIsProcessing(false);
          setFile(null);
          if (res.analysis) {
            setResult(res.analysis);
            toast({ title: "Analysis Complete", description: "Airway measurements calculated successfully." });
          } else {
            toast({ title: "Upload Complete", description: "Scan saved, but analysis failed." });
          }
          queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
          queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
          queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
          queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        },
        onError: () => {
          setIsProcessing(false);
          toast({ title: "Upload Failed", description: "Could not process the scan.", variant: "destructive" });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="section-header">
        <div className="text-xs font-semibold text-muted-foreground mb-1 tracking-widest uppercase">Home / Upload Scan</div>
        <h1 className="text-4xl font-display font-extrabold text-foreground leading-tight">Upload CBCT Scan</h1>
        <p className="text-muted-foreground mt-1 text-sm">Upload a DICOM or image file for automated airway AI analysis.</p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary/50 rounded-full z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500"
          style={{ width: result ? '100%' : file ? '50%' : '0%' }}
        />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary text-primary-foreground border-4 border-background shadow-[0_0_15px_hsl(var(--primary)/0.5)]">1</div>
          <span className="text-sm font-medium mt-2 text-foreground">Select Patient</span>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-background transition-all duration-300 ${file ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]' : 'bg-secondary text-muted-foreground'}`}>2</div>
          <span className={`text-sm font-medium mt-2 ${file ? 'text-foreground' : 'text-muted-foreground'}`}>Upload File</span>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 border-background transition-all duration-300 ${result ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]' : 'bg-secondary text-muted-foreground'}`}>3</div>
          <span className={`text-sm font-medium mt-2 ${result ? 'text-foreground' : 'text-muted-foreground'}`}>View Results</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="glass-panel border-none shadow-xl">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Patient</label>
                <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                  <SelectTrigger className="bg-background rounded-xl h-12 border-border/50 focus:ring-primary/30">
                    <SelectValue placeholder="Choose a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} (ID: {p.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Scan File</label>
                <div 
                  {...getRootProps()} 
                  className={`
                    border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                    ${isDragActive ? "border-primary bg-primary/10 shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] animate-pulse" : "border-border/60 hover:border-primary/50 hover:bg-secondary/20"}
                    ${file ? "bg-secondary/30 border-primary/30" : "bg-background/50"}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <File className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      >
                        <X className="w-4 h-4 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                        <UploadCloud className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">Drag & drop scan file here</p>
                      <p className="text-sm text-muted-foreground mt-1">Supports DICOM (.dcm), JPG, PNG up to 50MB</p>
                      <div className="mt-4 px-4 py-2 bg-secondary rounded-lg text-sm font-medium text-foreground inline-block">
                        Browse Files
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
                disabled={!file || !selectedPatient || isProcessing}
                onClick={handleUpload}
              >
                {isProcessing ? (
                  <><BrainCircuit className="animate-pulse w-5 h-5 mr-2" /> AI Analyzing...</>
                ) : (
                  "Upload & Analyze"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl border-primary/20 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.2)]"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-secondary flex items-center justify-center">
                    <Activity className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                  <svg className="absolute inset-0 w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeDasharray="75 225" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-bold mt-6 text-foreground">Running AI Diagnostics</h3>
                <p className="text-muted-foreground mt-2 max-w-[250px]">Segmenting airway, calculating volume, and assessing constriction geometry...</p>
              </motion.div>
            )}

            {result && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
              >
                <Card className="h-full glass-panel border-l-4 border-l-[hsl(var(--primary))] overflow-hidden flex flex-col">
                  <div className="bg-secondary/40 px-6 py-4 border-b border-border/50 flex justify-between items-center">
                    <h3 className="font-display font-bold text-lg flex items-center">
                      <BrainCircuit className="w-5 h-5 mr-2 text-primary" /> Analysis Results
                    </h3>
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={result.severity} />
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8 px-3 text-xs font-semibold border-border/60 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                        onClick={() => generateReport(result)}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                  
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-background/50 p-4 rounded-xl border border-border/40">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Min Area</p>
                        <p className="text-2xl font-mono font-bold text-foreground">{result.airwayArea.toFixed(1)} <span className="text-sm font-sans text-muted-foreground">mm²</span></p>
                      </div>
                      <div className="bg-background/50 p-4 rounded-xl border border-border/40">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Vol</p>
                        <p className="text-2xl font-mono font-bold text-foreground">{result.airwayVolume.toFixed(0)} <span className="text-sm font-sans text-muted-foreground">mm³</span></p>
                      </div>
                      <div className="col-span-2 bg-background/50 p-4 rounded-xl border border-border/40">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Constriction Severity</p>
                        <div className="flex items-center gap-3">
                          <p className="text-3xl font-display font-bold text-foreground">{result.minConstriction}%</p>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ 
                                width: `${result.minConstriction}%`,
                                backgroundColor: `hsl(var(--severity-${result.severity.toLowerCase()}))`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <h4 className="flex items-center text-sm font-bold text-primary uppercase tracking-wider mb-2">
                        <AlertTriangle className="w-4 h-4 mr-1.5" /> Clinical Recommendation
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed">{result.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!isProcessing && !result && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-border/40 rounded-2xl bg-secondary/10">
                <BrainCircuit className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">Upload a scan to view AI-generated airway metrics and clinical recommendations here.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
