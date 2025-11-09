import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, AlertCircle, Activity, Leaf, TrendingUp, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useRef } from 'react';

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

export const AnalysisResults = ({ data, language, imagePreview }: AnalysisResultsProps) => {
  const resultsRef = useRef<HTMLDivElement>(null);

  const chartData = [
    { name: 'Confidence', value: data.confidence, color: 'hsl(var(--success))' },
    { name: 'Uncertainty', value: 100 - data.confidence, color: 'hsl(var(--muted))' },
  ];

  const generatePDF = async () => {
    if (!resultsRef.current) return;

    try {
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
      pdf.save(`plant-disease-report-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Analysis Results</h2>
        <Button onClick={generatePDF} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF Report
        </Button>
      </div>

      <div ref={resultsRef} className="space-y-6 bg-background p-6 rounded-lg">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{data.diseaseName}</CardTitle>
                <CardDescription className="text-base">{data.scientificName}</CardDescription>
              </div>
              <Badge className={getSeverityColor(data.severity)}>
                {data.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Confidence Level</span>
                <span className="text-sm font-bold text-primary">{data.confidence}%</span>
              </div>
              <Progress value={data.confidence} className="h-2" />
            </div>
            <p className="text-foreground leading-relaxed">{data.description}</p>
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
                      {getSeverityData(data.severity)}%
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Spread Rate: <span className="font-semibold text-foreground">{data.spreadRate}</span>
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
              {data.symptoms.map((symptom, index) => (
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
                {data.affectedParts.map((part, index) => (
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
                {data.causes.map((cause, index) => (
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
              {data.treatment.map((step, index) => (
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
              {data.prevention.map((measure, index) => (
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