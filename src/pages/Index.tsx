import { useState } from 'react';
import { Leaf, Sparkles, ArrowRight } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { LanguageSelector } from '@/components/LanguageSelector';
import { AnalysisResults } from '@/components/AnalysisResults';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const Index = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const { toast } = useToast();

  const handleImageSelect = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
    setAnalysisData(null);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysisData(null);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      toast({
        title: 'No image selected',
        description: 'Please upload a plant image first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-plant-disease', {
        body: {
          imageData: imagePreview,
          language: language,
        },
      });

      if (error) {
        throw error;
      }

      setAnalysisData(data);
      toast({
        title: 'Analysis Complete',
        description: 'Plant disease has been successfully analyzed.',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze the plant image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">PlantCare AI</h1>
                <p className="text-sm text-muted-foreground">Smart Disease Detection</p>
              </div>
            </div>
            <LanguageSelector 
              value={language} 
              onChange={setLanguage} 
              disabled={isAnalyzing}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {!analysisData ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Plant Health Analysis
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Detect Plant Diseases
                <br />
                <span className="text-primary">In Seconds</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload a photo of your plant and get instant AI-powered disease detection with treatment recommendations in your preferred language.
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
              <ImageUpload
                onImageSelect={handleImageSelect}
                preview={imagePreview}
                onClear={handleClearImage}
                disabled={isAnalyzing}
              />

              {imagePreview && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    size="lg"
                    className="gap-2 text-lg px-8"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Plant
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI-Powered Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced computer vision analyzes plant health with high accuracy
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Multi-Language Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get results in 9 Indian languages for better understanding
                </p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Treatment Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Receive detailed treatment and prevention recommendations
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <Button
              onClick={() => {
                setAnalysisData(null);
                handleClearImage();
              }}
              variant="outline"
              className="mb-6"
            >
              ← Analyze Another Plant
            </Button>
            <AnalysisResults 
              data={analysisData} 
              language={language}
              imagePreview={imagePreview || ''}
              onLanguageChange={(newLang, newData) => {
                setLanguage(newLang);
                setAnalysisData(newData);
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2024 PlantCare AI. Powered by advanced AI technology.</p>
            <p className="mt-2">Helping farmers and gardeners protect their crops.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;