import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

import productsData from '@/data/products.json';
import { analyzeProductImage } from '@/services/geminiService';
import { useAppStore } from '@/store/useAppStore';

export function UploadBox({ onUploadSuccess }: { onUploadSuccess: (productId: number | 'custom') => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // preview of uploaded image
  const { setDynamicProduct } = useAppStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setError(null);
    setIsUploading(true);
    
    // Create a preview URL for the uploaded image
    const uploadedFile = acceptedFiles[0];
    const preview = URL.createObjectURL(uploadedFile);
    setPreviewUrl(preview);

    // Attempt to match the uploaded file name to a product in the database
    let fileName = uploadedFile.name.toLowerCase();
    
    // If the user uploads a back-of-pack label (e.g., '5 star label.png'), 
    // strip the ' label' part so it correctly matches the front-of-pack image name ('5 star.png')
    fileName = fileName.replace(' label.', '.');

    const matchedProduct = (productsData as any[]).find(p => 
      p.image && p.image.toLowerCase() === fileName
    );
    
    if (matchedProduct) {
      // Attach the preview image URL to the dynamic product (if needed)
      setDynamicProduct({ ...matchedProduct, imageUrl: previewUrl });
      setTimeout(() => {
        setIsUploading(false);
        setSuccess(true);
        setTimeout(() => {
          onUploadSuccess(matchedProduct.id);
        }, 500);
      }, 500);
    } else {
      analyzeProductImage(acceptedFiles[0]).then((ocrData) => {
        ocrData.id = 'custom';
        // Attach preview image URL to the custom product data
        setDynamicProduct({ ...ocrData, imageUrl: preview });
        setIsUploading(false);
        setSuccess(true);
        setTimeout(() => {
          onUploadSuccess('custom');
        }, 500);
      }).catch((e) => {
        console.error("OCR failed", e);
        setError("AI Analysis Failed: Ensure the backend is reachable and Gemini API Key is configured on the server.");
        setIsUploading(false);
      });
    }
  }, [onUploadSuccess, setDynamicProduct]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    maxFiles: 1 
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
        isDragActive ? 'border-primary bg-green-50' : 
        error ? 'border-red-300 bg-red-50/30' :
        'border-gray-300 hover:border-primary hover:bg-gray-50'
      } ${success ? 'border-green-500 bg-green-50' : error ? '' : 'bg-white'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        {isUploading ? (
          <>
            <div className="p-4 bg-primary/10 rounded-full">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Analyzing Product...</h3>
            <p className="text-sm text-gray-500">Extracting nutrition facts and ingredients</p>
          </>
        ) : previewUrl && !error ? (
          <>
            <img src={previewUrl} alt="Uploaded product" className="mx-auto max-h-48 object-contain mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Image Ready</h3>
          </>
        ) : error ? (
          <>
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Analysis Failed</h3>
            <p className="text-sm text-red-500">{error}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setError(null); }}
              className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Try Again
            </button>
          </>
        ) : success ? (
          <>
            <div className="p-4 bg-green-100 rounded-full">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Analysis Complete</h3>
          </>
        ) : (
          <>
            <div className="p-4 bg-gray-100 rounded-full group-hover:bg-green-100 transition-colors">
              <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">Upload Product Image</h3>
              <p className="text-sm text-gray-500">Drag and drop, or click to browse</p>
            </div>
            <p className="text-xs text-gray-400">Supports JPG, PNG, WEBP (Max 5MB)</p>
          </>
        )}
      </div>
    </div>
  );
}
