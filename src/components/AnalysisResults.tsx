import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle, Activity, Leaf, TrendingUp, Shield, Globe } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { languages } from './LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalysisData {
  diseaseName: string;
  scientificName: string;
  confidence: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  affectedParts: string[];
  spreadRate: string;
}

interface AnalysisResultsProps {
  data: AnalysisData;
  language: string;
  imagePreview: string;
  onLanguageChange?: (newLanguage: string, newData: AnalysisData) => void;
}

const getSeverityColor = (severity: string) => {
  const colors = {
    low: 'bg-success text-white',
    moderate: 'bg-warning text-white',
    high: 'bg-destructive text-white',
    critical: 'bg-destructive text-white',
  };
  return colors[severity as keyof typeof colors] || colors.moderate;
};

const getSeverityData = (severity: string) => {
  const severityMap = {
    low: 25,
    moderate: 50,
    high: 75,
    critical: 100,
  };
  return severityMap[severity as keyof typeof severityMap] || 50;
};

export const AnalysisResults = ({ data, language, imagePreview, onLanguageChange }: AnalysisResultsProps) => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentData, setCurrentData] = useState(data);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const { toast } = useToast();

  const chartData = [
    { name: 'Confidence', value: data.confidence, color: 'hsl(var(--success))' },
    { name: 'Uncertainty', value: 100 - data.confidence, color: 'hsl(var(--muted))' },
  ];

  const generatePDFInLanguage = async (selectedLanguage: string) => {
    if (!resultsRef.current) return;

    setIsGeneratingPDF(true);
    try {
      // If language is different, fetch new analysis
      let dataToUse = currentData;
      if (selectedLanguage !== currentLanguage) {
        toast({
          title: 'Translating...',
          description: `Generating report in ${languages.find(l => l.code === selectedLanguage)?.name}`,
        });

        const { data: translatedData, error } = await supabase.functions.invoke('analyze-plant-disease', {
          body: {
            imageData: imagePreview,
            language: selectedLanguage,
          },
        });

        if (error) throw error;
        dataToUse = translatedData;
        setCurrentData(translatedData);
        setCurrentLanguage(selectedLanguage);
        
        if (onLanguageChange) {
          onLanguageChange(selectedLanguage, translatedData);
        }

        // Wait a bit for the UI to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const languageName = languages.find(l => l.code === selectedLanguage)?.name || selectedLanguage;
      pdf.save(`plant-disease-report-${languageName}-${Date.now()}.pdf`);
      
      toast({
        title: 'PDF Downloaded',
        description: `Report generated in ${languageName}`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'PDF Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isGeneratingPDF} className="gap-2">
              {isGeneratingPDF ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Select Language
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {languages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => generatePDFInLanguage(lang.code)}
                className="cursor-pointer"
              >
                <span className="flex items-center justify-between w-full">
                  <span>{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={resultsRef} className="space-y-6 bg-background p-6 rounded-lg">
        {/* Language indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>
            Report Language: <span className="font-semibold text-foreground">
              {languages.find(l => l.code === currentLanguage)?.nativeName}
            </span>
          </span>
        </div>
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{currentData.diseaseName}</CardTitle>
                <CardDescription className="text-base">{currentData.scientificName}</CardDescription>
              </div>
              <Badge className={getSeverityColor(currentData.severity)}>
                {currentData.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence Level</span>
                <span className="text-sm font-bold text-primary">{currentData.confidence}%</span>
              </div>
              <Progress value={currentData.confidence} className="h-2" />
            </div>
            <p className="text-foreground leading-relaxed">{currentData.description}</p>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Detection Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Disease Severity
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[200px]">
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="10"
                      strokeDasharray={`${getSeverityData(data.severity) * 2.51} 251`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-foreground">
                      {getSeverityData(currentData.severity)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Spread Rate: <span className="font-semibold text-foreground">{currentData.spreadRate}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentData.symptoms.map((symptom, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">{symptom}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Affected Parts & Causes */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" />
                Affected Parts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentData.affectedParts.map((part, index) => (
                  <Badge key={index} variant="secondary">
                    {part}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Causes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentData.causes.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground">{cause}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Treatment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success" />
              Treatment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {currentData.treatment.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-foreground pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Prevention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-info" />
              Prevention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentData.prevention.map((measure, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-foreground">{measure}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Plant Image */}
        {imagePreview && (
          <Card>
            <CardHeader>
              <CardTitle>Analyzed Plant Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={imagePreview}
                alt="Analyzed plant"
                className="w-full max-w-md mx-auto rounded-lg border-2 border-border"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};